import { Injectable, Logger, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, EntityNotFoundError, EntityManager, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

export enum UserErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export class UserException extends Error {
  constructor(
    public readonly code: UserErrorCode,
    public readonly message: string,
    public readonly cause?: any
  ) {
    super(message);
    this.name = 'UserException';
  }
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async createUser(createUserDto: CreateUserDto, manager?: EntityManager): Promise<User> {
    const queryRunner = manager ? null : this.userRepository.manager.connection.createQueryRunner();
    const entityManager = manager || queryRunner?.manager;

    try {
      if (queryRunner) {
        await queryRunner.connect();
        await queryRunner.startTransaction();
      }

      // Check if user with email already exists
      const existingUser = await this.findByEmail(createUserDto.email, entityManager);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const user =  this.userRepository.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        verificationToken:createUserDto.verificationToken
      });
user.verificationToken=createUserDto.verificationToken
      // Assign roles if provided
      if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({id:In(createUserDto.roleIds)});
        if (roles.length !== createUserDto.roleIds.length) {
          throw new NotFoundException('One or more roles not found');
        }
        user.roles = roles;
      }

      // Save user
      const savedUser = await entityManager.save(user);

      if (queryRunner) {
        await queryRunner.commitTransaction();
      }

      return savedUser;
    } catch (error) {
      if (queryRunner) {
        await queryRunner.rollbackTransaction();
      }
      this.handleDatabaseError(error, 'Error creating user');
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      this.handleDatabaseError(error, 'Error fetching users');
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new EntityNotFoundError(User, { id });
      }
      return user;
    } catch (error) {
      this.handleDatabaseError(error, `Error finding user ${id}`);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      await this.userRepository.update(id, updateUserDto);
      return this.findOne(id);
    } catch (error) {
      this.handleDatabaseError(error, `Error updating user ${id}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        throw new EntityNotFoundError(User, { id });
      }
    } catch (error) {
      this.handleDatabaseError(error, `Error deleting user ${id}`);
    }
  }

  async findByEmail(
    email: string,
    manager?: EntityManager
  ): Promise<User | null> {
    try {
      const repository = manager 
      ? manager.getRepository(User) 
      : this.userRepository;
  
    return repository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'username'] 
    });
    } catch (error) {
      this.handleDatabaseError(error, `Error finding user by email ${email}`);
    }
  }

  async findByVerificationToken(
    token: string,
    manager?: EntityManager
  ): Promise<User | null> {
    try {
      const repository = manager 
        ? manager.getRepository(User) 
        : this.userRepository;
    
      return repository.findOne({ 
        where: { verificationToken: token },
      });
    } catch (error) {
      this.handleDatabaseError(error, `Error finding user by verification token`);
    }
  }

  private handleDatabaseError(error: any, context: string): never {
    this.logger.error(`${context}: ${error.message}`, error.stack);

    if (error instanceof EntityNotFoundError) {
      throw new NotFoundException('User not found');
    }

    if (error instanceof QueryFailedError) {
      // Handle specific database error codes
      const driverError = error.driverError;
      
      // PostgreSQL error code for unique violation
      if (driverError?.code === '23505') {
        throw new ConflictException('Email already exists');
      }

      // MySQL error code for duplicate entry
      if (driverError?.errno === 1062) {
        throw new ConflictException('Email already exists');
      }
    }

    // Convert to custom exception if you want to handle it in a global filter
    throw new InternalServerErrorException('Database operation failed');
  }
}