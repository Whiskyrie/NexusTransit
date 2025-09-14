import type { Request } from 'express';
import type { User } from '../../users/entities/user.entity';

/**
 * Authenticated Request Interface
 * Extensão do Request do Express com usuário autenticado
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}
