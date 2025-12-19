import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Incident } from './incident.entity';
import { User } from '../../users/entities/user.entity';
import { IncidentStatus } from '../enums/incident.enums';

/**
 * Entidade para rastrear histórico de mudanças de status dos incidentes
 *
 * Mantém um log completo de todas as transições de status,
 * incluindo quem realizou a mudança, quando e por quê.
 */
@Entity('incident_status_history')
@Index(['incident_id', 'created_at'])
@Index(['incident_id', 'new_status'])
export class IncidentStatusHistory extends BaseEntity {
  /**
   * ID do incidente relacionado
   */
  @Column({
    type: 'uuid',
    comment: 'ID do incidente',
  })
  incident_id!: string;

  /**
   * Status anterior do incidente
   */
  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Status anterior do incidente',
    nullable: true,
  })
  old_status?: string;

  /**
   * Novo status do incidente
   */
  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Novo status do incidente',
  })
  new_status!: string;

  /**
   * ID do usuário que realizou a mudança
   */
  @Column({
    type: 'uuid',
    comment: 'ID do usuário que realizou a mudança de status',
  })
  changed_by_user_id!: string;

  /**
   * Motivo ou comentário da mudança de status
   */
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo ou observação sobre a mudança de status',
  })
  reason?: string;

  /**
   * Dados adicionais da transição (metadata)
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados adicionais da transição em formato JSON',
  })
  metadata?: Record<string, unknown>;

  /**
   * Tempo decorrido no status anterior (em segundos)
   * Calculado automaticamente quando há status anterior
   */
  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo decorrido no status anterior em segundos',
  })
  time_in_previous_status?: number;

  // ============ Relacionamentos ============

  /**
   * Incidente relacionado
   */
  @ManyToOne(() => Incident)
  @JoinColumn({ name: 'incident_id' })
  incident?: Incident;

  /**
   * Usuário que realizou a mudança
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by_user_id' })
  changed_by_user?: User;

  // ============ Métodos Auxiliares ============

  /**
   * Verifica se foi uma transição inicial (criação do incidente)
   */
  isInitialStatus(): boolean {
    return !this.old_status;
  }

  /**
   * Obtém a direção da mudança de status
   */
  getTransitionDirection(): 'forward' | 'backward' | 'lateral' {
    if (!this.old_status) {
      return 'forward';
    }

    const statusOrder = [
      IncidentStatus.REPORTED,
      IncidentStatus.INVESTIGATING,
      IncidentStatus.IN_PROGRESS,
      IncidentStatus.RESOLVED,
      IncidentStatus.CLOSED,
    ];

    const oldIndex = statusOrder.indexOf(this.old_status as IncidentStatus);
    const newIndex = statusOrder.indexOf(this.new_status as IncidentStatus);

    if (oldIndex === -1 || newIndex === -1) {
      return 'lateral';
    }
    if (newIndex > oldIndex) {
      return 'forward';
    }
    if (newIndex < oldIndex) {
      return 'backward';
    }
    return 'lateral';
  }

  /**
   * Formata o tempo no status anterior de forma legível
   */
  getFormattedTimeInPreviousStatus(): string {
    if (!this.time_in_previous_status) {
      return 'N/A';
    }

    const seconds = this.time_in_previous_status;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  }
}
