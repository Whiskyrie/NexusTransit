import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatus } from '../enums/user-status.enum';
import { USER_ERROR_MESSAGES } from '../constants/user.constants';
import {
  UserBlockedException,
  UserInactiveException,
  EmailNotVerifiedException,
  WeakPasswordException,
} from '../exceptions/user.exceptions';
import {
  isPasswordStrong,
  getPasswordValidationErrors,
} from '../validators/strong-password.validator';

/**
 * Mapa de transições de status válidas
 */
const VALID_STATUS_TRANSITIONS: ReadonlyMap<UserStatus, readonly UserStatus[]> = new Map([
  [UserStatus.ACTIVE, [UserStatus.INACTIVE, UserStatus.SUSPENDED]],
  [UserStatus.INACTIVE, [UserStatus.ACTIVE, UserStatus.SUSPENDED]],
  [UserStatus.SUSPENDED, [UserStatus.ACTIVE, UserStatus.INACTIVE]],
]);

/**
 * Serviço de validação de regras de negócio de usuários
 *
 * Responsável por validações complexas que envolvem:
 * - Unicidade de dados
 * - Regras de segurança
 * - Regras de negócio
 */
@Injectable()
export class UserValidationService {
  private readonly logger = new Logger(UserValidationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Valida se email é único no sistema
   *
   * @param email - Email a ser validado
   * @param excludeUserId - ID do usuário a ser excluído da validação (para updates)
   * @throws BadRequestException se email já existe
   */
  async validateUniqueEmail(email: string, excludeUserId?: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const where: FindOptionsWhere<User> = { email: normalizedEmail };

    if (excludeUserId) {
      where.id = Not(excludeUserId);
    }

    const existingUser = await this.userRepository.findOne({ where });

    if (existingUser) {
      this.logger.warn(`Tentativa de usar email duplicado: ${normalizedEmail}`);
      throw new BadRequestException(USER_ERROR_MESSAGES.ALREADY_EXISTS);
    }
  }

  /**
   * Valida complexidade da senha usando o validator centralizado
   *
   * @param password - Senha a ser validada
   * @returns True se senha atende aos requisitos
   * @throws WeakPasswordException se senha não atende aos requisitos
   */
  validatePasswordStrength(password: string): boolean {
    if (isPasswordStrong(password)) {
      return true;
    }

    // Obter erros específicos para mensagem detalhada
    const errors = getPasswordValidationErrors(password);

    if (errors.length > 0) {
      throw new WeakPasswordException(errors[0]);
    }

    throw new WeakPasswordException(USER_ERROR_MESSAGES.WEAK_PASSWORD);
  }

  /**
   * Valida se usuário pode fazer login
   *
   * Verifica:
   * - Status ativo
   * - Email verificado
   * - Não bloqueado
   *
   * @param user - Usuário a ser validado
   * @throws UserBlockedException se usuário está bloqueado
   * @throws UserInactiveException se usuário está inativo
   * @throws EmailNotVerifiedException se email não foi verificado
   */
  validateUserCanLogin(user: User): void {
    // Verificar se está bloqueado
    if (user.status === UserStatus.SUSPENDED) {
      this.logger.warn(`Tentativa de login de usuário bloqueado: ${user.id}`);
      throw new UserBlockedException();
    }

    // Verificar se está inativo
    if (user.status === UserStatus.INACTIVE) {
      this.logger.warn(`Tentativa de login de usuário inativo: ${user.id}`);
      throw new UserInactiveException();
    }

    // Verificar se email foi verificado
    if (!user.email_verified) {
      this.logger.warn(`Tentativa de login com email não verificado: ${user.email}`);
      throw new EmailNotVerifiedException();
    }
  }

  /**
   * Valida se usuário pode ser deletado
   *
   * @param userId - ID do usuário
   * @returns True se pode ser deletado
   */
  validateUserCanBeDeleted(userId: string): boolean {
    // TODO: Adicionar regras de negócio específicas
    // Por exemplo: não permitir deletar se tiver pedidos em andamento
    this.logger.debug(`Validando se usuário ${userId} pode ser deletado`);
    return true;
  }

  /**
   * Valida se usuário pode mudar para determinado status
   *
   * @param currentStatus - Status atual
   * @param newStatus - Novo status desejado
   * @returns True se pode mudar
   */
  validateStatusTransition(currentStatus: UserStatus, newStatus: UserStatus): boolean {
    // Mesma transição não é necessária
    if (currentStatus === newStatus) {
      return true;
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS.get(currentStatus);

    if (!allowedTransitions) {
      this.logger.warn(`Status desconhecido: ${currentStatus}`);
      return false;
    }

    return allowedTransitions.includes(newStatus);
  }

  /**
   * Valida dados de criação de usuário
   *
   * @param email - Email do usuário
   * @param password - Senha do usuário
   */
  async validateUserCreation(email: string, password: string): Promise<void> {
    // Validar email único
    await this.validateUniqueEmail(email);

    // Validar força da senha
    this.validatePasswordStrength(password);

    this.logger.debug(`Validações de criação de usuário passaram para: ${email}`);
  }

  /**
   * Valida dados de atualização de usuário
   *
   * @param userId - ID do usuário sendo atualizado
   * @param email - Novo email (opcional)
   * @param password - Nova senha (opcional)
   */
  async validateUserUpdate(userId: string, email?: string, password?: string): Promise<void> {
    // Se email está sendo alterado, validar unicidade
    if (email) {
      await this.validateUniqueEmail(email, userId);
    }

    // Se senha está sendo alterada, validar força
    if (password) {
      this.validatePasswordStrength(password);
    }

    this.logger.debug(`Validações de atualização passaram para usuário: ${userId}`);
  }
}
