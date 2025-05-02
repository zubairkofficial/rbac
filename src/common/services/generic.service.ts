import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { IGenericService } from '../interfaces/generic-service.interface';

export class GenericService<T> implements IGenericService<T> {
  constructor(private readonly repository: Repository<T>) {}

  async create(createDto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity as any);
  }

  async findAll(options?: any): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as unknown as FindOptionsWhere<T> });
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
    await this.findOne(id); // Verify entity exists
    await this.repository.update(id, updateDto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity as any);
  }
} 