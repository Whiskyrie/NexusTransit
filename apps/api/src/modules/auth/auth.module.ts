import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService, TokenService, TokenBlacklistService } from './services';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '@nexus/redis';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';

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
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET não está configurado');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),

    // TypeORM para as entidades do Auth
    TypeOrmModule.forFeature([User, Role, Permission]),
  ],
  controllers: [AuthController],
  providers: [
    // Services
    AuthService,
    PasswordService,
    TokenService,
    TokenBlacklistService,

    // Strategies
    JwtStrategy,
  ],
  exports: [AuthService, JwtModule, TokenService, TokenBlacklistService],
})
export class AuthModule {}
