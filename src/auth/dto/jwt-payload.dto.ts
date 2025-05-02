import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEmail } from "class-validator";

export class JwtPayloadDto {
    @ApiProperty({
      example: '662c5a7ba805f2af8d5e88d4',
      description: 'Unique identifier for the user',
    })
    @IsNotEmpty()
    @IsString()
    id: string;
  
    @ApiProperty({
      example: 'user@example.com',
      description: "User's email address",
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
  
    @ApiProperty({
      example: 'admin',
      description: "User's role in the system",
      enum: ['admin', 'user', 'moderator'],
    })
    @IsNotEmpty()
    @IsString()
    role: string;
  }