import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Username of the user',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'true',
    description: 'isActive of the user',
  })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;


  @ApiProperty({
    example: 'false',
    description: 'emailVerified of the user',
  })
  @IsNotEmpty()
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password of the user',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    example: '16738292938737',
    description: 'verificationToken of the user',
  })
  @IsOptional()
  @IsString()
  verificationToken: string;

  @ApiProperty({
    example: [1, 2],
    description: 'Array of role IDs to assign to the user',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds?: number[];
}
