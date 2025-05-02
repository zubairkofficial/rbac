import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Resource } from './entities/resource.entity';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully', type: Resource })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Resource already exists' })
  create(@Body() createResourceDto: CreateResourceDto): Promise<Resource> {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'List of resources', type: [Resource] })
  findAll(@Query('isActive') isActive?: boolean): Promise<Resource[]> {
    return this.resourcesService.findAll(isActive !== undefined ? { isActive } : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  @ApiResponse({ status: 200, description: 'Resource found', type: Resource })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  findOne(@Param('id') id: number): Promise<Resource> {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully', type: Resource })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 409, description: 'Resource name already exists' })
  update(@Param('id') id: number, @Body() updateResourceDto: UpdateResourceDto): Promise<Resource> {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource' })
  @ApiResponse({ status: 200, description: 'Resource deleted successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  remove(@Param('id') id: number): Promise<void> {
    return this.resourcesService.remove(id);
  }
}
