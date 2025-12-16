import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  type DatabaseProvider,
  DrizzleAsyncProvider,
  drizzleProvider,
  InjectDrizzle,
} from './drizzle.provider';
import path from 'node:path';
import { migrate } from 'drizzle-orm/mysql2/migrator';

import * as fs from 'node:fs';

@Module({
  providers: [...drizzleProvider],
  exports: [DrizzleAsyncProvider],
})
export class DrizzleModule implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(DrizzleModule.name);
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}

  async onModuleInit() {
    this.logger.log('⏳ Running migrations...');
    const migrationsFolder = path.join(process.cwd(), 'migrations');
    this.logger.log(`🔎 Looking for migrations in: ${migrationsFolder}`);

    if (fs.existsSync(migrationsFolder)) {
      this.logger.log('📁 Migrations folder exists!');
      const files = fs.readdirSync(migrationsFolder);
      this.logger.log(`📄 Files in migrations folder: ${files.join(', ')}`);
    } else {
      this.logger.error('❌ Migrations folder DOES NOT exist!');
      // Debug: wat zit er wel in de root?
      this.logger.log(
        `Root contents: ${fs.readdirSync(process.cwd()).join(', ')}`,
      );
    }

    await migrate(this.db, {
      migrationsFolder: migrationsFolder,
    });
    this.logger.log('✅ Migrations completed!');
  }

  async onModuleDestroy() {
    await this.db.$client.end();
  }
}
