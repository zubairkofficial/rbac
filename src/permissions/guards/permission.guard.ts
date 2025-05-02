import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction } from '../entities/permission.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    // Check if user has any of the required permissions through their roles
    const hasPermission = this.checkPermissions(user.roles, requiredPermissions);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }

  private checkPermissions(roles: any[], requiredPermissions: string[]): boolean {
    // Get all permissions from user roles
    const userPermissions = roles.flatMap(role => 
      role.permissions.map(permission => 
        `${permission.resource.name}:${permission.action}`
      )
    );

    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission) ||
      userPermissions.includes(`${permission.split(':')[0]}:${PermissionAction.MANAGE}`)
    );
  }
} 