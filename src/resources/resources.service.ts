import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, FindOptionsWhere } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
  ) {}

  async create(createResourceDto: CreateResourceDto, manager?: EntityManager): Promise<Resource> {
    const repository = manager ? manager.getRepository(Resource) : this.resourceRepository;

    try {
      // Check if resource with the same name already exists
      const existing = await repository.findOne({
        where: { name: createResourceDto.name },
      });

      if (existing) {
        throw new ConflictException(`Resource with name '${createResourceDto.name}' already exists`);
      }

      const resource = repository.create(createResourceDto);
      return await repository.save(resource);
    } catch (error) {
      this.logger.error(`Failed to create resource: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(options?: { isActive?: boolean }): Promise<Resource[]> {
    try {
      const where: FindOptionsWhere<Resource> = {};
      
      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      return await this.resourceRepository.find({
        where,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find resources: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number): Promise<Resource> {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { id },
      });

      if (!resource) {
        throw new NotFoundException(`Resource with ID '${id}' not found`);
      }

      return resource;
    } catch (error) {
      this.logger.error(`Failed to find resource: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByName(name: string,manager?: EntityManager): Promise<Resource> {
    try {
      const repository = manager ? manager.getRepository(Resource) : this.resourceRepository;

      const resource = await repository.findOne({
        where: { name },
      });

      if (!resource) {
        throw new NotFoundException(`Resource with name '${name}' not found`);
      }

      return resource;
    } catch (error) {
      this.logger.error(`Failed to find resource by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updateResourceDto: UpdateResourceDto): Promise<Resource> {
    try {
      const resource = await this.findOne(id);

      // Check if trying to update name and name already exists for another resource
      if (updateResourceDto.name && updateResourceDto.name !== resource.name) {
        const existingWithName = await this.resourceRepository.findOne({
          where: { name: updateResourceDto.name },
        });

        if (existingWithName && existingWithName.id !== id) {
          throw new ConflictException(`Resource with name '${updateResourceDto.name}' already exists`);
        }
      }

      Object.assign(resource, updateResourceDto);
      return await this.resourceRepository.save(resource);
    } catch (error) {
      this.logger.error(`Failed to update resource: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const resource = await this.findOne(id);
      await this.resourceRepository.remove(resource);
    } catch (error) {
      this.logger.error(`Failed to remove resource: ${error.message}`, error.stack);
      throw error;
    }
  }
}
