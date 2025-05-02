import { Entity,  Column, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from 'src/roles/entities/role.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
 

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;


} 