import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'Name of the role',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Administrator with full access',
    description: 'Description of the role',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['read:users', 'create:users'],
    description: 'Permission names to be assigned to this role',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether the role is active',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
