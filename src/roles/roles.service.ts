import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, FindOptionsWhere, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private permissionsService: PermissionsService,
  ) {}

  async create(createRoleDto: CreateRoleDto, manager?: EntityManager): Promise<Role> {
    const repository = manager ? manager.getRepository(Role) : this.roleRepository;

    try {
      // Check if role with the same name already exists
      const existing = await repository.findOne({
        where: { name: createRoleDto.name },
      });

      if (existing) {
        throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
      }

      // Create role
      const role = repository.create({
        name: createRoleDto.name,
        description: createRoleDto.description,
        isActive: createRoleDto.isActive ?? true,
      });

      // Assign permissions if provided
      if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
        role.permissions = [];
        
        for (const permissionName of createRoleDto.permissions) {
          try {
            // Pass the manager to the permissions service if available
            const permission = await this.permissionsService.findByName(permissionName, manager);
            role.permissions.push(permission);
          } catch (error) {
            this.logger.warn(`Permission with name '${permissionName}' not found, skipping`);
          }
        }
      }

      return await repository.save(role);
    } catch (error) {
      this.logger.error(`Failed to create role: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(options?: { isActive?: boolean }): Promise<Role[]> {
    try {
      const where: FindOptionsWhere<Role> = {};
      
      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      return await this.roleRepository.find({
        where,
        relations: ['permissions', 'permissions.resource'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find roles: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['permissions', 'permissions.resource'],
      });

      if (!role) {
        throw new NotFoundException(`Role with ID '${id}' not found`);
      }

      return role;
    } catch (error) {
      this.logger.error(`Failed to find role: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByName(name: string, manager?: EntityManager): Promise<Role> {
    const repository = manager ? manager.getRepository(Role) : this.roleRepository;
    
    try {
      const role = await repository.findOne({
        where: { name },
        relations: ['permissions', 'permissions.resource'],
      });

      if (!role) {
        throw new NotFoundException(`Role with name '${name}' not found`);
      }

      return role;
    } catch (error) {
      this.logger.error(`Failed to find role by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      const role = await this.findOne(id);

      // Check if trying to update name and name already exists for another role
      if (updateRoleDto.name && updateRoleDto.name !== role.name) {
        const existingWithName = await this.roleRepository.findOne({
          where: { name: updateRoleDto.name },
        });

        if (existingWithName && existingWithName.id !== id) {
          throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists`);
        }
      }

      // Update basic fields
      if (updateRoleDto.name !== undefined) {
        role.name = updateRoleDto.name;
      }
      if (updateRoleDto.description !== undefined) {
        role.description = updateRoleDto.description;
      }
      if (updateRoleDto.isActive !== undefined) {
        role.isActive = updateRoleDto.isActive;
      }

      // Update permissions if provided
      if (updateRoleDto.permissions !== undefined) {
        if (updateRoleDto.permissions.length === 0) {
          role.permissions = [];
        } else {
          const permissions = [];
          
          for (const permissionName of updateRoleDto.permissions) {
            try {
              const permission = await this.permissionsService.findByName(permissionName);
              permissions.push(permission);
            } catch (error) {
              this.logger.warn(`Permission with name '${permissionName}' not found, skipping`);
            }
          }
          
          role.permissions = permissions;
        }
      }

      return await this.roleRepository.save(role);
    } catch (error) {
      this.logger.error(`Failed to update role: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const role = await this.findOne(id);
      await this.roleRepository.remove(role);
    } catch (error) {
      this.logger.error(`Failed to remove role: ${error.message}`, error.stack);
      throw error;
    }
  }
}
