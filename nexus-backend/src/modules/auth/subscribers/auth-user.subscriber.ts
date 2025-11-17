import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Subscriber para eventos de autenticação de usuários
 *
 * Monitora eventos do banco de dados relacionados a usuários
 * para registrar logs de auditoria e executar ações de segurança.
 */
@EventSubscriber()
export class AuthUserSubscriber implements EntitySubscriberInterface<User> {
  private readonly logger = new Logger(AuthUserSubscriber.name);

  listenTo(): typeof User {
    return User;
  }

  /**
   * Executado antes de inserir um novo usuário
   */
  beforeInsert(event: InsertEvent<User>): void {
    this.logger.debug(`Before insert user: ${JSON.stringify(event.entity)}`);

    // Validações adicionais antes da inserção
    if (event.entity) {
      // Garante que email esteja em lowercase
      if (event.entity.email) {
        event.entity.email = event.entity.email.toLowerCase();
      }
    }
  }

  /**
   * Executado após inserir um novo usuário
   */
  afterInsert(event: InsertEvent<User>): void {
    this.logger.log(`User created: ${event.entity?.id} - ${event.entity?.email}`);

    // Log de auditoria para criação de usuário
    if (event.entity) {
      this.logger.log(
        `AUDIT: User created - ID: ${event.entity.id}, Email: ${event.entity.email}, IP: ${event.queryRunner?.data?.ip ?? 'Unknown'}`,
      );
    }
  }

  /**
   * Executado antes de atualizar um usuário
   */
  beforeUpdate(event: UpdateEvent<User>): void {
    this.logger.debug(`Before update user: ${event.entity?.id}`);

    // Monitora alterações sensíveis
    if (event.entity && event.databaseEntity) {
      const changes: string[] = [];

      if (event.entity.password_hash !== event.databaseEntity.password_hash) {
        changes.push('password_hash');
      }

      if (event.entity.email !== event.databaseEntity.email) {
        changes.push('email');
      }

      if (event.entity.is_active !== event.databaseEntity.is_active) {
        changes.push('is_active');
      }

      if (changes.length > 0) {
        this.logger.warn(
          `AUDIT: Sensitive fields changed for user ${event.entity.id}: ${changes.join(', ')}`,
        );
      }
    }
  }

  /**
   * Executado após atualizar um usuário
   */
  afterUpdate(event: UpdateEvent<User>): void {
    this.logger.log(`User updated: ${event.entity?.id}`);

    // Log de auditoria para atualização
    if (event.entity) {
      this.logger.log(
        `AUDIT: User updated - ID: ${event.entity.id}, IP: ${event.queryRunner?.data?.ip ?? 'Unknown'}`,
      );
    }
  }

  /**
   * Executado antes de fazer soft remove de um usuário
   */
  beforeSoftRemove(event: SoftRemoveEvent<User>): void {
    this.logger.debug(`Before soft remove user: ${event.entity?.id}`);

    // Log de auditoria para remoção
    if (event.entity) {
      this.logger.warn(
        `AUDIT: User soft removed - ID: ${event.entity.id}, Email: ${event.entity.email}, IP: ${event.queryRunner?.data?.ip ?? 'Unknown'}`,
      );
    }
  }

  /**
   * Executado após fazer soft remove de um usuário
   */
  afterSoftRemove(event: SoftRemoveEvent<User>): void {
    this.logger.log(`User soft removed: ${event.entity?.id}`);
  }
}
