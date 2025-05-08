import { Injectable, ExecutionContext, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { Observable } from 'rxjs';
import { User } from '../../users/entities/user.entity';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private usersService: UsersService,
    private reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    this.logger.log(`Authentication check for: ${request.method} ${request.url}`);

    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('No Bearer token found in Authorization header');
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // For regular requests, use passport
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext): TUser {
    if (err || !user) {
      this.logger.error(`Authentication failed: ${err?.message || 'No user found'}`);
      throw new UnauthorizedException('Invalid token or token expired');
    }

    // The user object from JwtStrategy already contains the necessary data
    // No need to load it again since we're using eager loading in the User entity
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Attach the user data to the request
    const request = context.switchToHttp().getRequest();
    request.user = user;

    return user as TUser;
  }
}
