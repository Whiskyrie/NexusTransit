import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '@nexus/redis';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Module({
  imports: [
    // Módulos externos
    UsersModule,
    RedisModule,
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
            expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m') as any,
          },
        };
      },
      inject: [ConfigService],
    }),

    // TypeORM para as entidades do Auth
    TypeOrmModule.forFeature([Role, Permission]),
  ],
  providers: [JwtStrategy, TokenBlacklistService],
  exports: [JwtModule, TokenBlacklistService],
})
export class AuthModule {}
