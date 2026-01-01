import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import { User } from '../entities/user.entity';
import { USER_CONSTANTS } from '../constants/user.constants';

/**
 * Regex para identificar hash bcrypt
 * Hash bcrypt começa com $2a$, $2b$ ou $2y$
 */
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{1,2}\$.{53}$/;

/**
 * Subscriber para eventos da entidade User
 *
 * Responsável por:
 * - Hash automático de senha antes de inserir/atualizar
 * - Normalização de dados
 * - Logging de operações
 * - Validações de negócio no nível do banco
 *
 * @EventSubscriber - Registra automaticamente no TypeORM
 */
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  private readonly logger = new Logger(UserSubscriber.name);

  /**
   * Define qual entidade este subscriber escuta
   */
  listenTo(): typeof User {
    return User;
  }

  /**
   * Executado antes de inserir um usuário
   *
   * - Hash de senha
   * - Normalização de email
   * - Validações
   */
  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    const { entity: user } = event;

    if (!user) {
      return;
    }

    this.logger.debug(`Before insert: ${user.email}`);

    // Normalizar email
    if (user.email) {
      user.email = this.normalizeEmail(user.email);
    }

    // Hash da senha se não estiver hasheada
    if (user.password_hash && !this.isPasswordHashed(user.password_hash)) {
      user.password_hash = await this.hashPassword(user.password_hash);
      this.logger.debug(`Senha hasheada para usuário: ${user.email}`);
    }

    // Normalizar telefone
    if (user.phone) {
      user.phone = this.normalizePhone(user.phone);
    }
  }

  /**
   * Executado após inserir um usuário
   *
   * - Logging de auditoria
   */
  afterInsert(event: InsertEvent<User>): void {
    const { entity: user } = event;

    if (!user) {
      return;
    }

    this.logger.log(`Usuário criado: ${user.id} - ${user.email} - ${user.user_type}`);
  }

  /**
   * Executado antes de atualizar um usuário
   *
   * - Hash de senha se foi alterada
   * - Normalização de dados
   */
  async beforeUpdate(event: UpdateEvent<User>): Promise<void> {
    const { entity } = event;

    if (!entity) {
      return;
    }

    // Cast seguro após verificação
    const user = entity as User;

    this.logger.debug(`Before update: ${user.id}`);

    // Se email foi alterado, normalizar
    if (user.email) {
      user.email = this.normalizeEmail(user.email);
    }

    // Se senha foi alterada, verificar se precisa hash
    if (user.password_hash && !this.isPasswordHashed(user.password_hash)) {
      user.password_hash = await this.hashPassword(user.password_hash);
      this.logger.debug(`Senha atualizada para usuário: ${user.id}`);
    }

    // Normalizar telefone se foi alterado
    if (user.phone) {
      user.phone = this.normalizePhone(user.phone);
    }
  }

  /**
   * Executado após atualizar um usuário
   *
   * - Logging de auditoria
   */
  afterUpdate(event: UpdateEvent<User>): void {
    const { entity, updatedColumns } = event;

    if (!entity) {
      return;
    }

    const user = entity as User;

    this.logger.log(`Usuário atualizado: ${user.id}`);

    // Logar campos alterados
    if (updatedColumns && updatedColumns.length > 0) {
      const changedFields = updatedColumns.map(col => col.propertyName).join(', ');
      this.logger.debug(`Campos alterados: ${changedFields}`);
    }
  }

  /**
   * Executado antes de fazer soft remove
   *
   * - Validações antes de remover
   */
  beforeSoftRemove(event: SoftRemoveEvent<User>): void {
    const { entity: user } = event;

    if (!user) {
      return;
    }

    this.logger.debug(`Before soft remove: ${user.id}`);
  }

  /**
   * Executado após fazer soft remove
   *
   * - Logging de auditoria
   */
  afterSoftRemove(event: SoftRemoveEvent<User>): void {
    const { entity: user } = event;

    if (!user) {
      return;
    }

    this.logger.log(`Usuário removido (soft delete): ${user.id} - ${user.email}`);
  }

  /**
   * Executado antes de remover permanentemente
   *
   * - Validações críticas
   */
  beforeRemove(event: RemoveEvent<User>): void {
    const { entity: user } = event;

    if (!user) {
      return;
    }

    this.logger.warn(`ATENÇÃO: Remoção permanente de usuário: ${user.id} - ${user.email}`);
  }

  /**
   * Executado após remover permanentemente
   *
   * - Logging de auditoria crítico
   */
  afterRemove(event: RemoveEvent<User>): void {
    const { entity: user } = event;

    if (!user) {
      return;
    }

    this.logger.warn(`Usuário removido PERMANENTEMENTE: ${user.id} - ${user.email}`);
  }

  // ============================================
  // Métodos auxiliares privados
  // ============================================

  /**
   * Verifica se senha já está hasheada (bcrypt)
   *
   * @param password - Senha a verificar
   * @returns True se já está hasheada
   */
  private isPasswordHashed(password: string): boolean {
    return BCRYPT_HASH_REGEX.test(password);
  }

  /**
   * Faz hash da senha usando bcrypt
   *
   * @param password - Senha em texto plano
   * @returns Senha hasheada
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = USER_CONSTANTS.SECURITY.BCRYPT_SALT_ROUNDS;
    return hash(password, saltRounds);
  }

  /**
   * Normaliza email para lowercase e sem espaços
   *
   * @param email - Email a normalizar
   * @returns Email normalizado
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Normaliza telefone removendo caracteres não numéricos
   *
   * @param phone - Telefone a normalizar
   * @returns Telefone normalizado (apenas números)
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
