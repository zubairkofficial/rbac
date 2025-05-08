import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiProperty({
    example: 1,
    description: 'Permission ID',
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    example: 2,
    description: 'Role ID',
  })
  @IsNotEmpty()
  @IsNumber()
  roleId: number;

  @ApiProperty({
    example: true,
    description: 'Whether to add or remove the permission from the role',
  })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
} 