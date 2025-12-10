import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule as NexusDatabaseModule } from "@nexus/database";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";

// Config
import configurations from "./config/configurations";
import { getDatabaseConfig } from "./config/database.config";

// Modules
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";
import { RedisModule } from "@nexus/redis";
import { HealthModule } from "./health/health.module";
import { AuditModule } from "@nexus/audit";
import { LoggingModule } from "@nexus/logger";

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: ["../../.env", ".env"],
    }),

    // Database Module - Schema 'auth'
    NexusDatabaseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return config as any;
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Schedule Module for cron jobs
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    UsersModule,
    RolesModule,
    RedisModule.forRootAsync(),
    HealthModule,
    LoggingModule,
    AuditModule,
  ],
})
export class AppModule {}
