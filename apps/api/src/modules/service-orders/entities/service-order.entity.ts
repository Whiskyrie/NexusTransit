import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity, Auditable } from '@nexus/common';
import { OrderStatus } from '../enums/service_order-status';
import { OrderPriority } from '../enums/service_order-priority';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Driver } from '../../drivers/entities/driver.entity';

/**
 * ServiceOrder Entity - Sistema de ordens de serviço para logística
 *
 * Gerencia ordens de serviço relacionadas a manutenção, entregas especiais,
 * coletas programadas e outros serviços operacionais.
 *
 * Features:
 * - Controle completo do ciclo de vida da ordem
 * - Integração com veículos e motoristas
 * - Sistema de prioridades e status
 * - Rastreamento de custos e tempo
 * - Agendamento e execução
 */
@Entity('service_orders')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at'],
  entityDisplayName: 'Ordem de Serviço',
})
@Index(['order_number'])
@Index(['status'])
@Index(['priority'])
@Index(['vehicle_id'])
@Index(['driver_id'])
@Index(['scheduled_date'])
@Index(['service_type'])
export class ServiceOrder extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: 'Número único da ordem de serviço (ex: OS-2024-00001)',
  })
  order_number!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    comment: 'Status atual da ordem de serviço',
  })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
    comment: 'Prioridade da ordem de serviço',
  })
  priority!: OrderPriority;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Tipo de serviço (MAINTENANCE, DELIVERY, PICKUP, INSPECTION, etc)',
  })
  service_type!: string;

  @Column({
    type: 'varchar',
    length: 200,
    comment: 'Título resumido da ordem de serviço',
  })
  title!: string;

  @Column({
    type: 'text',
    comment: 'Descrição detalhada do serviço a ser executado',
  })
  description!: string;

  // Relacionamentos
  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do veículo associado (se aplicável)',
  })
  vehicle_id?: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: Driver;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do motorista responsável (se aplicável)',
  })
  driver_id?: string;

  // Datas e agendamento
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora agendada para execução',
  })
  scheduled_date?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora de início da execução',
  })
  started_at?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora de conclusão',
  })
  completed_at?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora de cancelamento',
  })
  cancelled_at?: Date;

  // Informações financeiras
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Custo estimado do serviço',
  })
  estimated_cost!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Custo real do serviço executado',
  })
  actual_cost?: number;

  // Tempo estimado e real
  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo estimado em minutos',
  })
  estimated_duration_minutes?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo real de execução em minutos',
  })
  actual_duration_minutes?: number;

  // Localização
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Endereço onde o serviço será executado',
  })
  service_location?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    comment: 'Latitude do local do serviço',
  })
  latitude?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    comment: 'Longitude do local do serviço',
  })
  longitude?: number;

  // Informações adicionais
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais sobre a ordem',
  })
  notes?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo do cancelamento (se aplicável)',
  })
  cancellation_reason?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Resultado ou relatório final da execução',
  })
  completion_report?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Usuário que criou a ordem',
  })
  created_by?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Usuário que atualizou pela última vez',
  })
  updated_by?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados adicionais em formato JSON',
  })
  metadata?: Record<string, unknown>;

  // Checklist e anexos
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Lista de itens do checklist',
  })
  checklist?: {
    id: string;
    description: string;
    completed: boolean;
    completed_at?: Date;
    completed_by?: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Anexos/documentos relacionados',
  })
  attachments?: {
    id: string;
    filename: string;
    url: string;
    type: string;
    uploaded_at: Date;
    uploaded_by: string;
  }[];
}
