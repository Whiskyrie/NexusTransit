import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule as NexusDatabaseModule } from '@nexus/database';
import type { DatabaseConfig } from '../config/database.config';

/** 
    Database Module - Configures TypeORM integration with NestJS
**/

@Module({
  imports: [
    NexusDatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');

        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        return {
          ...dbConfig,
          autoLoadEntities: true,
          // entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
          // subscribers: [path.join(__dirname, '..', '**', '*.subscriber{.ts,.js}')],
          // migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
          extra: {
            application_name: 'nexus-transit-api',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [NexusDatabaseModule],
})
export class DatabaseModule {}
