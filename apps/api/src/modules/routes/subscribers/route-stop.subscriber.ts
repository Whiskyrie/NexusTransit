/**
 * RouteStop Subscriber
 *
 * TypeORM Entity Subscriber para monitorar mudanças em paradas de rota.
 *
 * Responsável por:
 * - Validar sequenciamento de paradas
 * - Detectar mudanças em horários planejados
 * - Logar adição/remoção de paradas
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
import { RouteStop } from '../entities/route_stop.entity';

@Injectable()
@EventSubscriber()
export class RouteStopSubscriber implements EntitySubscriberInterface<RouteStop> {
  private readonly logger = new Logger(RouteStopSubscriber.name);

  /**
   * Define que este subscriber escuta eventos da entidade RouteStop
   */
  listenTo(): typeof RouteStop {
    return RouteStop;
  }

  /**
   * Hook executado após inserção de uma nova parada
   *
   * @param event - Evento de inserção
   */
  afterInsert(event: InsertEvent<RouteStop>): void {
    const entity = event.entity;

    this.logger.log(
      `Nova parada adicionada à rota ${entity.route_id}: ` + `Sequência ${entity.sequence_order}`,
    );
  }

  /**
   * Hook executado após atualização de uma parada
   *
   * Detecta mudanças em horários e sequenciamento
   *
   * @param event - Evento de atualização
   */
  afterUpdate(event: UpdateEvent<RouteStop>): void {
    const entity = event.entity as RouteStop | undefined;

    if (!entity) {
      return;
    }

    // Detecta mudanças de sequência
    if (this.hasSequenceChanged(event)) {
      const oldSeq = event.databaseEntity?.sequence_order;
      const newSeq = entity.sequence_order;

      this.logger.log(
        `Sequência da parada alterada: ${oldSeq} → ${newSeq} ` + `(Rota: ${entity.route_id})`,
      );
    }

    // Detecta mudanças de horário planejado
    if (this.hasPlannedTimeChanged(event)) {
      this.logger.log(`Horário planejado da parada alterado (Rota: ${entity.route_id})`);
    }
  }

  /**
   * Hook executado após remoção de uma parada
   *
   * @param event - Evento de soft delete
   */
  afterSoftRemove(event: SoftRemoveEvent<RouteStop>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(
      `Parada removida da rota ${entity.route_id}: ` + `Sequência ${entity.sequence_order}`,
    );
  }

  /**
   * Verifica se a sequência da parada foi alterada
   *
   * @param event - Evento de atualização
   * @returns true se a sequência mudou
   */
  private hasSequenceChanged(event: UpdateEvent<RouteStop>): boolean {
    const oldSeq = event.databaseEntity?.sequence_order;
    const newSeq = (event.entity as RouteStop)?.sequence_order;

    return oldSeq !== undefined && oldSeq !== newSeq;
  }

  /**
   * Verifica se o horário planejado foi alterado
   *
   * @param event - Evento de atualização
   * @returns true se o horário mudou
   */
  private hasPlannedTimeChanged(event: UpdateEvent<RouteStop>): boolean {
    const oldTime = event.databaseEntity?.planned_arrival_time;
    const newTime = (event.entity as RouteStop)?.planned_arrival_time;

    // Verifica se ambos os valores existem
    if (!oldTime || !newTime) {
      return false;
    }

    // Compara strings de tempo diretamente
    return oldTime !== newTime;
  }
}
