import { ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/register.dto';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private dataSource: DataSource,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async signUp(input: SignupDto): Promise<{ accessToken: string; user: User; verificationSent: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists within transaction
      const existingUser = await this.usersService.findByEmail(input.email, queryRunner.manager);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const userInput = { 
        ...input, 
        password: hashedPassword,
        emailVerified: false,
        verificationToken: this.generateVerificationToken()
      };

      // Create user within transaction
      const newUser = await this.usersService.createUser(userInput, queryRunner.manager);
      
      // Generate token
      const accessToken = this.jwtService.sign({
        sub: newUser.id,
        email: newUser.email,
        username: newUser.username,
      });

      // Send verification email
      const verificationSent = await this.sendVerificationEmail(newUser);

      await queryRunner.commitTransaction();
      return { accessToken, user: newUser, verificationSent };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleAuthError(error, 'Failed to sign up user');
    } finally {
      await queryRunner.release();
    }
  }

  async signIn(credentials: { email: string; password: string }): Promise<{ accessToken: string; user: Partial<User> }> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      const user = await this.validateUser(credentials.email, credentials.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
      });
      
      return { accessToken, user };
    } catch (error) {
      this.handleAuthError(error, 'Failed to sign in user');
    } finally {
      await queryRunner.release();
    }
  }
  
  async validateUser(email: string, password: string): Promise<Partial<User> | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      const user = await this.usersService.findByEmail(email, queryRunner.manager);

      if (!user) return null;
      if (!user.password) {
        this.logger.warn(`User ${email} has no password set`);
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? (({ password, ...rest }) => rest)(user) : null;
    } catch (error) {
      this.handleAuthError(error, 'User validation failed');
    } finally {
      await queryRunner.release();
    }
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async sendVerificationEmail(user: User): Promise<boolean> {
    try {
      const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${user.verificationToken}`;
      
      // Here you would integrate with your email service
      // For example using nodemailer or a service like SendGrid, Mailgun, etc.
      this.logger.log(`Verification email would be sent to ${user.email} with URL: ${verificationUrl}`);
      
      // Implement your actual email sending logic here
      // For example:
      await this.emailService.sendVerificationEmail(user,verificationUrl);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${user.email}`, error.stack);
      return false;
    }
  }

  async verifyEmail(token: string): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Find user with matching verification token
      const user = await this.usersService.findByVerificationToken(token, queryRunner.manager);
      
      if (!user) {
        throw new UnauthorizedException('Invalid verification token');
      }
      
      // Mark user as verified
      user.emailVerified = true;
      user.verificationToken = null;
      
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      
      // Return URL to redirect to after successful verification
      const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      return `${baseUrl}/auth/verification-success`;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleAuthError(error, 'Email verification failed');
    } finally {
      await queryRunner.release();
    }
  }

  async resendVerificationEmail(email: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const user = await this.usersService.findByEmail(email, queryRunner.manager);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      if (user.emailVerified) {
        throw new ConflictException('Email already verified');
      }
      
      // Generate new token if needed
      if (!user.verificationToken) {
        user.verificationToken = this.generateVerificationToken();
        await queryRunner.manager.save(user);
      }
      
      const emailSent = await this.sendVerificationEmail(user);
      await queryRunner.commitTransaction();
      
      return emailSent;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleAuthError(error, 'Failed to resend verification email');
    } finally {
      await queryRunner.release();
    }
  }

  private handleAuthError(error: Error, context: string): never {
    this.logger.error(`${context}: ${error.message}`, error.stack);

    if (error instanceof ConflictException) {
      throw error;
    }

    // Handle specific database errors if needed
    throw new InternalServerErrorException('Authentication process failed');
  }
}