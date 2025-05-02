import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ResourcesService } from '../resources/resources.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeedersService {
  private readonly logger = new Logger(SeedersService.name);

  constructor(
    private dataSource: DataSource,
    private usersService: UsersService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
    private resourcesService: ResourcesService,
    private configService: ConfigService,
  ) {}

  /**
   * Seeds the initial admin user with role and permissions
   */
  async seedAdmin() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Check if admin user already exists
      try {
        const existingAdmin = await this.usersService.findByEmail(
          'admin@example.com',
          queryRunner.manager
        );
        
        if (existingAdmin) {
          throw new ConflictException('Admin user already exists');
        }
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
        // If not found, continue with seeding
      }

      this.logger.log('Seeding admin user with full permissions...');

      // 1. Create resources
      const resources = [
        { name: 'users', description: 'User management' },
        { name: 'roles', description: 'Role management' },
        { name: 'permissions', description: 'Permission management' },
        { name: 'resources', description: 'Resource management' },
      ];

      const createdResources = [];
      for (const resource of resources) {
        createdResources.push(
          await this.resourcesService.create(resource, queryRunner.manager)
        );
      }

      // 2. Create permissions for each resource
      const permissions = [];
      const actions = ['create', 'read', 'update', 'delete'];

      for (const resource of createdResources) {
        for (const action of actions) {
          permissions.push(
            await this.permissionsService.create(
              {
                name: `${action}:${resource.name}`,
                description: `Can ${action} ${resource.name}`,
                resourceName: resource.name,
                action,
              },
              queryRunner.manager
            )
          );
        }
      }

      // 3. Create admin role
      const adminRole = await this.rolesService.create(
        {
          name: 'admin',
          description: 'Administrator with full access',
          permissions: permissions.map(p => p.name),
          isActive: true,
        },
        queryRunner.manager
      );

      // 4. Create admin user
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'Admin@123');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminUser = await this.usersService.createUser(
        {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          isActive: true,
          emailVerified: true,
          roles: [adminRole],
        },
        queryRunner.manager
      );

      await queryRunner.commitTransaction();
      
      this.logger.log(`Admin user created successfully with ID: ${adminUser.id}`);
      return { 
        message: 'Admin user created successfully',
        adminEmail: adminUser.email,
        adminRole: adminRole.name,
        permissionsCount: permissions.length
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to seed admin: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seeds test data for development purposes
   */
  async seedTestData() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Seeding test data...');

      // 1. Create user role
      let userRole;
      try {
        userRole = await this.rolesService.findByName('user', queryRunner.manager);
      } catch (error) {
        // Create the role if it doesn't exist
        userRole = await this.rolesService.create(
          {
            name: 'user',
            description: 'Regular user with limited access',
            isActive: true,
          },
          queryRunner.manager
        );

        // Find all read permissions
        const readPermissions = await queryRunner.manager.getRepository('permissions').find({
          where: { action: 'read' },
        });

        // Assign read permissions to user role
        userRole.permissions = readPermissions;
        await queryRunner.manager.save(userRole);
      }

      // 2. Create moderator role
      let moderatorRole;
      try {
        moderatorRole = await this.rolesService.findByName('moderator', queryRunner.manager);
      } catch (error) {
        // Create a set of resources for moderator
        const modResources = ['users', 'roles'];
        
        const permissions = [];
        for (const resourceName of modResources) {
          try {
            const resource = await this.resourcesService.findByName(resourceName, queryRunner.manager);
            
            // Add CRUD permissions for this resource
            const actions = ['create', 'read', 'update', 'delete'];
            for (const action of actions) {
              const permName = `${action}:${resourceName}`;
              try {
                const perm = await this.permissionsService.findByName(permName, queryRunner.manager);
                permissions.push(perm);
              } catch (error) {
                // Skip if permission doesn't exist
              }
            }
          } catch (error) {
            // Skip if resource doesn't exist
          }
        }
        
        moderatorRole = await this.rolesService.create(
          {
            name: 'moderator',
            description: 'Moderator with some administrative privileges',
            permissions: permissions.map(p => p.name),
            isActive: true,
          },
          queryRunner.manager
        );
      }

      // 3. Create test users
      const testUsers = [
        {
          username: 'testuser1',
          email: 'user1@example.com',
          password: 'Test@123',
          roles: [userRole],
        },
        {
          username: 'testuser2',
          email: 'user2@example.com',
          password: 'Test@123',
          roles: [userRole],
        },
        {
          username: 'moderator',
          email: 'moderator@example.com',
          password: 'Mod@123',
          roles: [moderatorRole],
        },
      ];

      for (const userData of testUsers) {
        try {
          await this.usersService.findByEmail(userData.email, queryRunner.manager);
          this.logger.log(`User ${userData.email} already exists, skipping`);
        } catch (error) {
          // User doesn't exist, create it
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await this.usersService.createUser(
            {
              ...userData,
              password: hashedPassword,
              isActive: true,
              emailVerified: true,
            },
            queryRunner.manager
          );
          this.logger.log(`Created test user: ${userData.email}`);
        }
      }

      await queryRunner.commitTransaction();
      return { message: 'Test data created successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to seed test data: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 