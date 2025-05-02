import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('resources')
export class Resource extends BaseEntity {
 
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Permission, permission => permission.resource)
  permissions: Permission[];

  @Column({ default: true })
  isActive: boolean;
}