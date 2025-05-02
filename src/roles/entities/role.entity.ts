import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('roles')
export class Role extends BaseEntity {
  
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;


  @ApiProperty({
    description: 'Whether the role is active or not',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
  
  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];


 
}