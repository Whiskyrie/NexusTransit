import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Auditable } from '../../vehicles/decorators/auditable.decorator';
import { Route } from './route.entity';
import { CustomerAddress } from '../../customers/entities/customer-address.entity';
import { PointTransformer } from '../../../common/transformers/point.transformer';

/**
 * RouteStop Entity - Pontos de parada em uma rota
 *
 * Features:
 * - Sequenciamento de paradas
 * - Registro de horários planejados e reais
 * - Status de cada parada
 * - Observações e problemas
 * - Coordenadas geográficas
 */
@Entity('route_stops')
@Index(['route_id'])
@Index(['customer_address_id'])
@Index(['sequence_order'])
@Index(['status'])
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Parada de Rota',
})
export class RouteStop extends BaseEntity {
  // Relacionamento com Rota
  @ManyToOne(() => Route, route => route.stops, {
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

  // Relacionamento com Endereço do Cliente
  @ManyToOne(() => CustomerAddress, address => address.route_stops, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_address_id' })
  customer_address!: CustomerAddress;

  @Column({
    type: 'uuid',
    comment: 'ID do endereço do cliente',
  })
  customer_address_id!: string;

  // Sequência
  @Column({
    type: 'integer',
    comment: 'Ordem de parada na rota',
  })
  sequence_order!: number;

  // Status da Parada
  @Column({
    type: 'varchar',
    length: 50,
    default: 'PENDING',
    comment: 'Status da parada: PENDING, IN_PROGRESS, COMPLETED, SKIPPED, FAILED',
  })
  status!: string;

  // Endereço (duplicado para histórico)
  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Endereço completo da parada',
  })
  address!: string;

  @Column({
    type: 'point',
    nullable: true,
    comment: 'Coordenadas geográficas (lat, lng)',
    transformer: PointTransformer,
  })
  coordinates?: string;

  // Horários Planejados
  @Column({
    type: 'time',
    nullable: true,
    comment: 'Horário de chegada planejado',
  })
  planned_arrival_time?: string;

  @Column({
    type: 'time',
    nullable: true,
    comment: 'Horário de partida planejado',
  })
  planned_departure_time?: string;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo estimado de parada em minutos',
  })
  estimated_stop_duration_minutes?: number;

  // Horários Reais
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Horário real de chegada',
  })
  actual_arrival_time?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Horário real de partida',
  })
  actual_departure_time?: Date;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Duração real da parada em minutos',
  })
  actual_stop_duration_minutes?: number;

  // Distâncias
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Distância desde a parada anterior em km',
  })
  distance_from_previous_km?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo estimado desde parada anterior em minutos',
  })
  estimated_time_from_previous_minutes?: number;

  // Informações da Entrega
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados da entrega/coleta nesta parada',
  })
  delivery_data?: {
    type?: 'DELIVERY' | 'PICKUP' | 'BOTH';
    order_numbers?: string[];
    items_count?: number;
    weight_kg?: number;
    volume_m3?: number;
    requires_signature?: boolean;
    requires_photo?: boolean;
    special_instructions?: string;
  };

  // Contato
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de contato do destinatário',
  })
  contact_info?: {
    name?: string;
    phone?: string;
    email?: string;
    alternative_phone?: string;
  };

  // Restrições e Requisitos
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Restrições específicas desta parada',
  })
  restrictions?: {
    access_hours?: {
      start_time?: string;
      end_time?: string;
    };
    vehicle_restrictions?: string[];
    requires_appointment?: boolean;
    parking_notes?: string;
    access_instructions?: string;
  };

  // Observações
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais da parada',
  })
  notes?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo de falha ou problema (se aplicável)',
  })
  failure_reason?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora que foi marcada como completa',
  })
  completed_at?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora que foi pulada',
  })
  skipped_at?: Date;

  // Prova de Entrega (se aplicável)
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados da prova de entrega',
  })
  proof_of_delivery?: {
    signature_url?: string;
    photo_urls?: string[];
    recipient_name?: string;
    recipient_document?: string;
    delivery_notes?: string;
    timestamp?: string;
  };

  // Métodos auxiliares

  /**
   * Verifica se a parada foi completada
   */
  isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  /**
   * Verifica se a parada está pendente
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Verifica se a parada está em progresso
   */
  isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  /**
   * Verifica se a parada foi pulada
   */
  isSkipped(): boolean {
    return this.status === 'SKIPPED';
  }

  /**
   * Verifica se houve falha
   */
  hasFailed(): boolean {
    return this.status === 'FAILED';
  }

  /**
   * Calcula duração real da parada em minutos
   */
  getActualDuration(): number | null {
    if (!this.actual_arrival_time || !this.actual_departure_time) {
      return null;
    }

    const arrival = new Date(this.actual_arrival_time).getTime();
    const departure = new Date(this.actual_departure_time).getTime();

    return Math.floor((departure - arrival) / (1000 * 60));
  }

  /**
   * Verifica se está atrasada
   */
  isDelayed(): boolean {
    if (!this.planned_arrival_time || !this.actual_arrival_time) {
      return false;
    }

    const planned = new Date(`1970-01-01T${this.planned_arrival_time}`);
    const actual = new Date(this.actual_arrival_time);

    const plannedMinutes = planned.getHours() * 60 + planned.getMinutes();
    const actualMinutes = actual.getHours() * 60 + actual.getMinutes();

    return actualMinutes > plannedMinutes;
  }

  /**
   * Calcula atraso em minutos
   */
  getDelayMinutes(): number {
    if (!this.planned_arrival_time || !this.actual_arrival_time) {
      return 0;
    }

    const planned = new Date(`1970-01-01T${this.planned_arrival_time}`);
    const actual = new Date(this.actual_arrival_time);

    const plannedMinutes = planned.getHours() * 60 + planned.getMinutes();
    const actualMinutes = actual.getHours() * 60 + actual.getMinutes();

    return Math.max(0, actualMinutes - plannedMinutes);
  }
}
