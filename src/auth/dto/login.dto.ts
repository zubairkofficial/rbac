import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: "User's password",
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}