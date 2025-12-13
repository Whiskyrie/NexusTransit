/**
 * Route Subscriber
 *
 * TypeORM Entity Subscriber para auditoria automática
 * de operações CRUD nas rotas.
 *
 * Implementa hooks do ciclo de vida da entidade:
 * - afterInsert: Log de criação
 * - afterUpdate: Log de atualização e detecção de mudanças
 * - beforeSoftRemove: Validações antes da exclusão
 * - afterSoftRemove: Log de exclusão
 *
 * @module Routes
 */

import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Route } from '../entities/route.entity';
import { RouteStatus } from '../enums/route-status';

@Injectable()
@EventSubscriber()
export class RouteSubscriber implements EntitySubscriberInterface<Route> {
  private readonly logger = new Logger(RouteSubscriber.name);

  /**
   * Define que este subscriber escuta eventos da entidade Route
   */
  listenTo(): typeof Route {
    return Route;
  }

  /**
   * Hook executado após inserção de uma nova rota
   *
   * @param event - Evento de inserção com a entidade criada
   */
  afterInsert(event: InsertEvent<Route>): void {
    const entity = event.entity;

    this.logger.log(
      `Nova rota criada: ${entity.route_code} | ` +
        `Status: ${entity.status} | ` +
        `Data planejada: ${entity.planned_date?.toISOString() ?? 'Não definida'}`,
    );
  }

  /**
   * Hook executado após atualização de uma rota
   *
   * Detecta e loga mudanças específicas como status, veículo ou motorista
   *
   * @param event - Evento de atualização
   */
  afterUpdate(event: UpdateEvent<Route>): void {
    const entity = event.entity as Route | undefined;

    if (!entity) {
      return;
    }

    // Detecta mudanças de status
    if (this.hasStatusChanged(event)) {
      const oldStatus = event.databaseEntity?.status;
      const newStatus = entity.status;

      this.logger.log(
        `Status da rota ${entity.route_code} alterado: ` + `${oldStatus} → ${newStatus}`,
      );
    }

    // Detecta mudanças de veículo
    if (this.hasVehicleChanged(event)) {
      this.logger.log(`Veículo da rota ${entity.route_code} foi alterado`);
    }

    // Detecta mudanças de motorista
    if (this.hasDriverChanged(event)) {
      this.logger.log(`Motorista da rota ${entity.route_code} foi alterado`);
    }
  }

  /**
   * Hook executado antes da exclusão (soft delete) de uma rota
   *
   * Pode ser usado para validações adicionais
   *
   * @param event - Evento de soft delete
   */
  beforeSoftRemove(event: SoftRemoveEvent<Route>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    // Log de warn para rotas em progresso sendo excluídas
    if (entity.status === RouteStatus.IN_PROGRESS) {
      this.logger.warn(`Tentativa de exclusão de rota em progresso: ${entity.route_code}`);
    }
  }

  /**
   * Hook executado após exclusão (soft delete) de uma rota
   *
   * @param event - Evento de soft delete
   */
  afterSoftRemove(event: SoftRemoveEvent<Route>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(
      `Rota removida (soft delete): ${entity.route_code} | ` + `Status final: ${entity.status}`,
    );
  }

  /**
   * Verifica se o status da rota foi alterado
   *
   * @param event - Evento de atualização
   * @returns true se o status mudou
   */
  private hasStatusChanged(event: UpdateEvent<Route>): boolean {
    const oldStatus = event.databaseEntity?.status;
    const newStatus = (event.entity as Route)?.status;

    return oldStatus !== undefined && oldStatus !== newStatus;
  }

  /**
   * Verifica se o veículo da rota foi alterado
   *
   * @param event - Evento de atualização
   * @returns true se o veículo mudou
   */
  private hasVehicleChanged(event: UpdateEvent<Route>): boolean {
    const oldVehicleId = event.databaseEntity?.vehicle_id;
    const newVehicleId = (event.entity as Route)?.vehicle_id;

    return oldVehicleId !== undefined && oldVehicleId !== newVehicleId;
  }

  /**
   * Verifica se o motorista da rota foi alterado
   *
   * @param event - Evento de atualização
   * @returns true se o motorista mudou
   */
  private hasDriverChanged(event: UpdateEvent<Route>): boolean {
    const oldDriverId = event.databaseEntity?.driver_id;
    const newDriverId = (event.entity as Route)?.driver_id;

    return oldDriverId !== undefined && oldDriverId !== newDriverId;
  }
}
