import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { EmailService } from 'src/email/email.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
    imports: [
      ConfigModule, // ✅ Add this line
      UsersModule,
      PassportModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.get('JWT_SECRET', 'supersecret'),
          signOptions: { expiresIn: '1d' },
        }),
      }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy,EmailService, JwtAuthGuard],
    controllers: [AuthController],
    exports: [AuthService,JwtModule, JwtAuthGuard],
  })
  export class AuthModule {}