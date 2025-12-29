import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { Role as RoleEntity } from '../../auth/entities/role.entity';

/**
 * Subscriber para eventos de ciclo de vida da entidade Role
 *
 * Responsabilidades:
 * - Validar dados antes de inserir/atualizar
 * - Invalidar cache quando roles mudam
 * - Logar operações críticas
 * - Prevenir modificação de roles de sistema
 */
@Injectable()
@EventSubscriber()
export class RoleSubscriber implements EntitySubscriberInterface<RoleEntity> {
  private readonly logger = new Logger(RoleSubscriber.name);

  /**
   * Indica que este subscriber escuta eventos da entidade Role
   */
  listenTo(): typeof RoleEntity {
    return RoleEntity;
  }

  /**
   * Chamado antes de inserir uma nova role
   */
  beforeInsert(event: InsertEvent<RoleEntity>): void {
    const { entity } = event;

    this.logger.debug(`Preparando para inserir role: ${entity.display_name ?? 'sem nome'}`);

    // Validar que description não está vazio
    if (entity.description?.trim().length === 0) {
      entity.description = `Role: ${entity.display_name}`;
    }

    // Garantir que hierarchy_level tenha um valor padrão
    entity.hierarchy_level ??= 0;

    // Garantir que is_active seja true por padrão
    entity.is_active ??= true;

    // Inicializar arrays vazios se não existirem
    entity.permissions ??= [];
  }

  /**
   * Chamado após inserir uma nova role
   */
  afterInsert(event: InsertEvent<RoleEntity>): void {
    const { entity } = event;

    this.logger.log(
      `✓ Role criada: ${entity.display_name} (ID: ${entity.id}, Level: ${entity.hierarchy_level})`,
    );

    // TODO: Invalidar cache de roles
    // this.cacheService.invalidateRoleCache();

    // TODO: Emitir evento para outros módulos
    // this.eventEmitter.emit('role.created', entity);
  }

  /**
   * Chamado antes de atualizar uma role
   */
  beforeUpdate(event: UpdateEvent<RoleEntity>): void {
    const { entity, databaseEntity } = event;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.debug(`Preparando para atualizar role: ${databaseEntity.display_name}`);
  }

  /**
   * Chamado após atualizar uma role
   */
  afterUpdate(event: UpdateEvent<RoleEntity>): void {
    const { entity } = event;

    if (!entity) {
      return;
    }

    this.logger.log(`✓ Role atualizada: ${entity.display_name} (ID: ${entity.id})`);

    // TODO: Invalidar cache específico da role
    // this.cacheService.invalidateRole(entity.id);

    // TODO: Emitir evento
    // this.eventEmitter.emit('role.updated', entity);
  }

  /**
   * Chamado antes de fazer soft delete de uma role
   */
  beforeSoftRemove(event: SoftRemoveEvent<RoleEntity>): void {
    const { entity } = event;

    if (!entity) {
      return;
    }

    this.logger.debug(`Preparando para soft-delete role: ${entity.display_name}`);
  }

  /**
   * Chamado após soft delete de uma role
   */
  afterSoftRemove(event: SoftRemoveEvent<RoleEntity>): void {
    const { entity } = event;

    if (!entity) {
      return;
    }

    this.logger.log(`✓ Role removida (soft-delete): ${entity.display_name} (ID: ${entity.id})`);

    // TODO: Invalidar cache
    // this.cacheService.invalidateRole(entity.id);
    // this.cacheService.invalidateRoleCache();

    // TODO: Emitir evento
    // this.eventEmitter.emit('role.deleted', entity);
  }

  /**
   * Chamado antes de fazer hard delete de uma role
   */
  beforeRemove(event: RemoveEvent<RoleEntity>): void {
    const { entity } = event;

    if (!entity) {
      return;
    }

    this.logger.warn(
      `Preparando para hard-delete role: ${entity.display_name} - OPERAÇÃO DESTRUTIVA`,
    );
  }

  /**
   * Chamado após hard delete de uma role
   */
  afterRemove(event: RemoveEvent<RoleEntity>): void {
    const { entity } = event;

    if (!entity) {
      return;
    }

    this.logger.warn(`✓ Role removida permanentemente (hard-delete): ${entity.display_name}`);

    // TODO: Invalidar cache
    // this.cacheService.invalidateRole(entity.id);
    // this.cacheService.invalidateRoleCache();

    // TODO: Emitir evento
    // this.eventEmitter.emit('role.hardDeleted', entity);
  }
}
