import { ApiProperty } from '@nestjs/swagger';
import { JwtPayloadDto } from './jwt-payload.dto';

export class LoggedUserDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({ type: JwtPayloadDto })
  user: JwtPayloadDto;
}