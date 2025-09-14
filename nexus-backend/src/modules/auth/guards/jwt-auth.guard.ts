import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * Guard para proteger rotas com autenticação JWT
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
