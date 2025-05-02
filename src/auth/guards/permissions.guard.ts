import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // No user attached to the request
    if (!user) {
      return false;
    }

    // Check if user has required permissions
    return this.hasPermissions(user, requiredPermissions);
  }

  private hasPermissions(user: User, requiredPermissions: string[]): boolean {
    // Get all unique permissions from user's roles
    const userPermissions = new Set<string>();
    
    // Check if user has roles
    if (!user.roles || user.roles.length === 0) {
      return false;
    }
    
    // Collect all permissions from user's roles
    for (const role of user.roles) {
      if (role.permissions) {
        for (const permission of role.permissions) {
          userPermissions.add(permission.name);
        }
      }
    }

    // Check if user has all required permissions
    return requiredPermissions.every(permission => userPermissions.has(permission));
  }
} 