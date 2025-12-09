import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Route } from './route.entity';
import { RouteStatus } from '../enums/route-status';

/**
 * RouteHistory Entity - Histórico de alterações de rotas
 *
 * Features:
 * - Rastreamento completo de mudanças
 * - Auditoria de alterações de status
 * - Registro de quem fez cada alteração
 * - Valores anteriores e novos
 */
@Entity('route_history')
@Index(['route_id'])
@Index(['event_type'])
@Index(['created_at'])
@Index(['user_id'])
export class RouteHistory extends BaseEntity {
  // Relacionamento com Rota
  @ManyToOne(() => Route, route => route.history, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_id' })
  route!: Route;

  @Column({
    type: 'uuid',
    comment: 'ID da rota',
  })
  route_id!: string;

  // Tipo de Evento
  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Tipo de evento/alteração',
  })
  event_type!: string;

  @Column({
    type: 'text',
    comment: 'Descrição do evento',
  })
  description!: string;

  // Status (se aplicável)
  @Column({
    type: 'enum',
    enum: RouteStatus,
    nullable: true,
    comment: 'Status anterior',
  })
  previous_status?: RouteStatus;

  @Column({
    type: 'enum',
    enum: RouteStatus,
    nullable: true,
    comment: 'Novo status',
  })
  new_status?: RouteStatus;

  // Valores Alterados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Campos que foram alterados',
  })
  changed_fields?: {
    field_name: string;
    old_value: unknown;
    new_value: unknown;
  }[];

  // Informações do Usuário
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que fez a alteração',
  })
  user_id?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Nome do usuário que fez a alteração',
  })
  user_name?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tipo de usuário (admin, driver, system, etc)',
  })
  user_type?: string;

  // Contexto Adicional
  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP de origem da alteração',
  })
  ip_address?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'User agent (navegador/app)',
  })
  user_agent?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais do evento',
  })
  metadata?: {
    source?: string; // 'web', 'mobile', 'api', 'system'
    reason?: string;
    additional_info?: Record<string, unknown>;
  };

  // Observações
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações sobre a alteração',
  })
  notes?: string;

  // Métodos auxiliares

  /**
   * Verifica se foi uma alteração de status
   */
  isStatusChange(): boolean {
    return this.previous_status !== null && this.new_status !== null;
  }

  /**
   * Verifica se a alteração foi feita pelo sistema
   */
  isSystemGenerated(): boolean {
    return this.user_type === 'system' || this.user_id === null;
  }

  /**
   * Formata a descrição do evento para exibição
   */
  getFormattedDescription(): string {
    if (this.isStatusChange()) {
      return `Status alterado de ${this.previous_status} para ${this.new_status}`;
    }
    return this.description;
  }
}
