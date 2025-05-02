import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query
  } from '@nestjs/common';
  
  import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { PermissionsService } from './permissions.service';
  import { CreatePermissionDto } from './dto/create-permission.dto';
  import { UpdatePermissionDto } from './dto/update-permission.dto';
  import { Permission } from './entities/permission.entity';
  
  @ApiTags('permissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Controller('permissions')
  export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new permission' })
    @ApiResponse({ status: 201, description: 'Permission created successfully', type: Permission })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Permission already exists' })
    create(@Body() createPermissionDto: CreatePermissionDto): Promise<Permission> {
      return this.permissionsService.create(createPermissionDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all permissions' })
    @ApiResponse({ status: 200, description: 'List of permissions', type: [Permission] })
    findAll(
      @Query('isActive') isActive?: boolean,
      @Query('resourceName') resourceName?: string,
    ): Promise<Permission[]> {
      return this.permissionsService.findAll({ isActive, resourceName });
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a permission by ID' })
    @ApiResponse({ status: 200, description: 'Permission found', type: Permission })
    @ApiResponse({ status: 404, description: 'Permission not found' })
    findOne(@Param('id') id: number): Promise<Permission> {
      return this.permissionsService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update a permission' })
    @ApiResponse({ status: 200, description: 'Permission updated successfully', type: Permission })
    @ApiResponse({ status: 404, description: 'Permission not found' })
    @ApiResponse({ status: 409, description: 'Permission name already exists' })
    update(
      @Param('id') id: number, 
      @Body() updatePermissionDto: UpdatePermissionDto
    ): Promise<Permission> {
      return this.permissionsService.update(id, updatePermissionDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a permission' })
    @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
    @ApiResponse({ status: 404, description: 'Permission not found' })
    remove(@Param('id') id: number): Promise<void> {
      return this.permissionsService.remove(id);
    }
  }
  