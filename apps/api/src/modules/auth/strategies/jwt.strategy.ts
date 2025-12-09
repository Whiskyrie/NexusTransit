import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

/**
 * JWT Strategy
 * Estratégia de autenticação JWT para Passport
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET não está configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // Permite acessar o request no validate
    });
  }

  /**
   * Valida o payload do JWT e retorna o usuário
   */
  async validate(req: { headers: { authorization?: string } }, payload: JwtPayload): Promise<User> {
    // Extrai o token da requisição
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    // Verifica se o token está na blacklist
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token foi invalidado');
    }

    // Verifica se todos os tokens do usuário foram invalidados
    const areUserTokensBlacklisted = await this.tokenBlacklistService.areUserTokensBlacklisted(
      payload.sub,
    );
    if (areUserTokensBlacklisted) {
      throw new UnauthorizedException('Tokens do usuário foram invalidados');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Token inválido: usuário não encontrado');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Email não verificado');
    }

    // Retorna o usuário que será anexado ao request
    return user;
  }
}
