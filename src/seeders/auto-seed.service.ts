import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeedersService } from './seeders.service';

@Injectable()
export class AutoSeedService implements OnModuleInit {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(
    private seedersService: SeedersService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const autoSeed = this.configService.get<string>('AUTO_SEED_ADMIN', 'true') === 'true';
    
    if (autoSeed) {
      try {
        this.logger.log('Auto-seeding admin user...');
        await this.seedersService.seedAdmin();
      } catch (error) {
        if (error.message.includes('already exists')) {
          this.logger.log('Admin user already exists, skipping seed');
        } else {
          this.logger.error('Failed to auto-seed admin', error.stack);
        }
      }
    }
  }
} 