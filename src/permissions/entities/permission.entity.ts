import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Resource } from '../../resources/entities/resource.entity';


export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PermissionAction,
    default: PermissionAction.READ,
  })
  action: PermissionAction;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Resource, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;
}