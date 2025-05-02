import { DeepPartial } from 'typeorm';

export interface IGenericService<T> {
  create(createDto: DeepPartial<T>): Promise<T>;
  findAll(options?: any): Promise<T[]>;
  findOne(id: string): Promise<T>;
  update(id: string, updateDto: DeepPartial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}