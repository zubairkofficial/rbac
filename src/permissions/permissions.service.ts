import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, FindOptionsWhere } from 'typeorm';
import { Permission, PermissionAction } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ResourcesService } from '../resources/resources.service';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private resourcesService: ResourcesService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto, manager?: EntityManager): Promise<Permission> {
    const repository = manager ? manager.getRepository(Permission) : this.permissionRepository;

    try {
      // Check if permission with the same name already exists
      const existing = await repository.findOne({
        where: { name: createPermissionDto.name },
      });

      if (existing) {
        throw new ConflictException(`Permission with name '${createPermissionDto.name}' already exists`);
      }

      // Find the resource
      const resource = manager 
        ? await this.resourcesService.findByName(createPermissionDto.resourceName, manager)
        : await this.resourcesService.findByName(createPermissionDto.resourceName);

      // Create and save the permission
      const permission = repository.create({
        name: createPermissionDto.name,
        description: createPermissionDto.description,
        action: createPermissionDto.action as PermissionAction,
        isActive: createPermissionDto.isActive ?? true,
        resource: resource,
      });

      return await repository.save(permission);
    } catch (error) {
      this.logger.error(`Failed to create permission: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(options?: { isActive?: boolean; resourceName?: string }): Promise<Permission[]> {
    try {
      const where: FindOptionsWhere<Permission> = {};
      
      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      if (options?.resourceName) {
        where.resource = { name: options.resourceName };
      }

      return await this.permissionRepository.find({
        where,
        relations: ['resource'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number): Promise<Permission> {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { id },
        relations: ['resource'],
      });

      if (!permission) {
        throw new NotFoundException(`Permission with ID '${id}' not found`);
      }

      return permission;
    } catch (error) {
      this.logger.error(`Failed to find permission: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByName(name: string, manager?: EntityManager): Promise<Permission> {
    const repository = manager ? manager.getRepository(Permission) : this.permissionRepository;
    
    try {
      const permission = await repository.findOne({
        where: { name },
        relations: ['resource'],
      });

      if (!permission) {
        throw new NotFoundException(`Permission with name '${name}' not found`);
      }

      return permission;
    } catch (error) {
      this.logger.error(`Failed to find permission by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    try {
      const permission = await this.findOne(id);

      // Check if trying to update name and name already exists for another permission
      if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
        const existingWithName = await this.permissionRepository.findOne({
          where: { name: updatePermissionDto.name },
        });

        if (existingWithName && existingWithName.id !== id) {
          throw new ConflictException(`Permission with name '${updatePermissionDto.name}' already exists`);
        }
      }

      // Update resource if provided
      if (updatePermissionDto.resourceName) {
        const resource = await this.resourcesService.findByName(updatePermissionDto.resourceName);
        permission.resource = resource;
      }

      // Update other fields
      if (updatePermissionDto.description !== undefined) {
        permission.description = updatePermissionDto.description;
      }
      if (updatePermissionDto.action !== undefined) {
        permission.action = updatePermissionDto.action as PermissionAction;
      }
      if (updatePermissionDto.isActive !== undefined) {
        permission.isActive = updatePermissionDto.isActive;
      }
      if (updatePermissionDto.name !== undefined) {
        permission.name = updatePermissionDto.name;
      }

      return await this.permissionRepository.save(permission);
    } catch (error) {
      this.logger.error(`Failed to update permission: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const permission = await this.findOne(id);
      await this.permissionRepository.remove(permission);
    } catch (error) {
      this.logger.error(`Failed to remove permission: ${error.message}`, error.stack);
      throw error;
    }
  }
}
