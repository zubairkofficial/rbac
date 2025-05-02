import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SeedersService } from './seeders.service';

@ApiTags('seeders')
@Controller('seeders')
export class SeedersController {
  constructor(private readonly seedersService: SeedersService) {}

  @Post('admin')
  @ApiOperation({ summary: 'Seed admin user with full permissions' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @ApiResponse({ status: 409, description: 'Admin user already exists' })
  seedAdmin() {
    return this.seedersService.seedAdmin();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('test-data')
  @ApiOperation({ summary: 'Seed test data for development' })
  @ApiResponse({ status: 201, description: 'Test data created successfully' })
  seedTestData() {
    return this.seedersService.seedTestData();
  }
} 