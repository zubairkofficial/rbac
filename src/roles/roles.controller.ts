import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionAction } from '../permissions/entities/permission.entity';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions({ resource: 'roles', action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: Role })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions({ resource: 'roles', action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles', type: [Role] })
  findAll(@Query('isActive') isActive?: boolean): Promise<Role[]> {
    return this.rolesService.findAll(isActive !== undefined ? { isActive } : undefined);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'roles', action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Role found', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id') id: number): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'roles', action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  update(@Param('id') id: number, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'roles', action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  remove(@Param('id') id: number): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Put('permissions')
  @RequirePermissions({ resource: 'roles', action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update role permission' })
  @ApiResponse({ status: 200, description: 'Role permission updated successfully' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  async updateRolePermission(@Body() updateRolePermissionDto: UpdateRolePermissionDto) {
    return this.rolesService.updateRolePermission(updateRolePermissionDto);
  }
}
