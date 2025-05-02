// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // ✅ this registers Repository<User>
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // or UserRepository if needed elsewhere
})
export class UsersModule {}
