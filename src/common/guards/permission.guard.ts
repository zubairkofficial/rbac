import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction } from '../../permissions/entities/permission.entity';

export interface RequiredPermission {
  resource: string;
  action: PermissionAction;
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (permissions: RequiredPermission[]) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('User has no roles assigned');
    }

    // Get all permissions from user's roles
    const userPermissions = user.roles.flatMap(role => 
      role.permissions.map(permission => ({
        resource: permission.resource.name,
        action: permission.action
      }))
    );

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(required => 
      userPermissions.some(userPerm => 
        userPerm.resource === required.resource && 
        userPerm.action === required.action
      )
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
} 