import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ResourcesModule } from '../resources/resources.module';
import { AutoSeedService } from './auto-seed.service';
import { SeedersController } from './seeders.controller';
import { SeedersService } from './seeders.service';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    ResourcesModule,
  ],
  controllers: [SeedersController],
  providers: [SeedersService, AutoSeedService],
})
export class SeedersModule {} 