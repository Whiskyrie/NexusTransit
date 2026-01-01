import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO para atualização de usuário
 *
 * Herda todos os campos de CreateUserDto como opcionais,
 * EXCETO o campo password (use endpoint específico para alterar senha)
 *
 * Validações aplicadas:
 * - Todos os campos são opcionais
 * - Email único (se informado)
 * - Limites de caracteres mantidos
 * - Normalização automática de dados
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}
