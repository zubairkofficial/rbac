import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
  BadRequestException,
  Redirect,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignupDto } from './dto/register.dto';
import { SignInDto } from './dto/login.dto';
import { Public } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  async signUp(@Body() dto: SignupDto) {
    try {
      return await this.authService.signUp(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('signin')
  @ApiOperation({ summary: 'Generate OTP for login' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  async signIn(@Body() input: SignInDto) {
    try {
      return await this.authService.signIn(input);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend URL' })
  @Redirect()
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      const redirectUrl = await this.authService.verifyEmail(token);
      return { url: redirectUrl };
    } catch (error) {
      return {
        url: `${process.env.FRONTEND_URL}/verification-failure?reason=` + 
          encodeURIComponent(error.message),
      };
    }
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body('email') email: string) {
    try {
      const sent = await this.authService.resendVerificationEmail(email);
      return { success: sent, message: 'Verification email sent' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: SignInDto) {
    return this.authService.signIn(loginDto);
  }
}
