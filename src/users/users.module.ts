// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]), // ✅ this registers Repository<User> and Repository<Role>
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // or UserRepository if needed elsewhere
})
export class UsersModule {}
