import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';
import { AuditModule } from '../audit/audit.module';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Module({
  imports: [
    // Módulos externos
    UsersModule,
    RedisModule,
    AuditModule,
    PassportModule,
    ConfigModule,

    // JWT Module com configuração assíncrona
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET não está configurado');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
          },
        };
      },
      inject: [ConfigService],
    }),

    // TypeORM para as entidades do Auth
    TypeOrmModule.forFeature([Role, Permission]),

    // ThrottlerModule para rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60),
          limit: configService.get<number>('THROTTLE_LIMIT', 10),
        },
      ],
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, TokenBlacklistService],
})
export class AuthModule {}
