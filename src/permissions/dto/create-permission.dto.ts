import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'read:users',
    description: 'Name of the permission',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Can read user data',
    description: 'Description of the permission',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'users',
    description: 'Resource this permission is for',
  })
  @IsNotEmpty()
  @IsString()
  resourceName: string;

  @ApiProperty({
    example: 'read',
    description: 'Action type (create, read, update, delete)',
  })
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiProperty({
    example: true,
    description: 'Whether the permission is active',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
