import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Auditable } from '@nexus/audit';
import { OrderStatus } from '../enums/service_order-status';
import { OrderPriority } from '../enums/service_order-priority';
import { OrderType } from '../enums/order-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerAddress } from '../../customers/entities/customer-address.entity';

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
@Index(['order_type'])
@Index(['customer_id'])
@Index(['vehicle_id'])
@Index(['driver_id'])
@Index(['scheduled_date'])
@Index(['service_type'])
@Index(['payment_status'])
@Index(['created_by'])
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
    type: 'enum',
    enum: OrderType,
    default: OrderType.PICKUP_DELIVERY,
    comment: 'Tipo de ordem (PICKUP_DELIVERY, DELIVERY_ONLY, RETURN, TRANSFER)',
  })
  order_type!: OrderType;

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
  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({
    type: 'uuid',
    comment: 'ID do cliente associado',
  })
  customer_id!: string;

  @ManyToOne(() => CustomerAddress, { nullable: true })
  @JoinColumn({ name: 'pickup_address_id' })
  pickup_address?: CustomerAddress;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do endereço de coleta',
  })
  pickup_address_id?: string;

  @ManyToOne(() => CustomerAddress, { nullable: true })
  @JoinColumn({ name: 'delivery_address_id' })
  delivery_address?: CustomerAddress;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do endereço de entrega',
  })
  delivery_address_id?: string;

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
    comment: 'Data solicitada pelo cliente',
  })
  requested_date?: Date;

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

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Prazo de entrega',
  })
  delivery_deadline?: Date;

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

  // Informações de pagamento
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    comment: 'Status do pagamento',
  })
  payment_status!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
    comment: 'Método de pagamento',
  })
  payment_method?: PaymentMethod;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Número da nota fiscal',
  })
  invoice_number?: string;

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

  // Contatos
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nome do contato na coleta',
  })
  pickup_contact_name?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone do contato na coleta',
  })
  pickup_contact_phone?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nome do contato na entrega',
  })
  delivery_contact_name?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone do contato na entrega',
  })
  delivery_contact_phone?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Instruções especiais',
  })
  special_instructions?: string;

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

  // Informações de carga
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Peso total em kg',
  })
  total_weight?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    comment: 'Volume total em m³',
  })
  total_volume?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Quantidade de volumes',
  })
  package_count?: number;

  // Seguro
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Requer seguro',
  })
  requires_insurance!: boolean;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Valor do seguro',
  })
  insurance_value?: number;

  // SLA
  @Column({
    type: 'integer',
    nullable: true,
    comment: 'SLA em horas',
  })
  sla_hours?: number;

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
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que aprovou a ordem',
  })
  approved_by_user_id?: string;

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
