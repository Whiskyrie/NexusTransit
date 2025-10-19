import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDataSource } from './data-source';
import type { DatabaseConfig } from '../config/database.config';
import { DataSource } from 'typeorm';

/** 
    Database Module - Configures TypeORM integration with NestJS
**/

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');

        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        // Use the same DataSource configuration
        const dataSource = createDataSource(configService);
        return dataSource.options;
      },
      inject: [ConfigService],
      dataSourceFactory: async options => {
        if (!options) {
          throw new Error('DataSource options not found');
        }
        const dataSource = new DataSource(options);
        await dataSource.initialize();
        return dataSource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
