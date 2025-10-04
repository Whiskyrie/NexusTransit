import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryPriority } from '../enums/delivery-priority.enum';
import { Customer } from '../../customers/entities/customer.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { DeliveryAttempt } from './delivery-attempt.entity';
import { DeliveryProof } from './delivery-proof.entity';
import { DeliveryStatusHistory } from './delivery-status-history.entity';

/**
 * Delivery Entity - Sistema de gerenciamento de entregas
 *
 * Features:
 * - Controle completo do ciclo de vida de entregas
 * - Rastreamento em tempo real
 * - Sistema de status e prioridades
 * - Integração com clientes, motoristas e veículos
 * - Histórico completo de tentativas e comprovantes
 */
@Entity('deliveries')
@Index(['tracking_code'])
@Index(['status'])
@Index(['priority'])
@Index(['customer_id'])
@Index(['driver_id'])
@Index(['vehicle_id'])
@Index(['scheduled_delivery_at'])
export class Delivery extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: 'Código de rastreamento único da entrega',
  })
  tracking_code!: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
    comment: 'Status atual da entrega',
  })
  status!: DeliveryStatus;

  @Column({
    type: 'enum',
    enum: DeliveryPriority,
    default: DeliveryPriority.NORMAL,
    comment: 'Prioridade da entrega',
  })
  priority!: DeliveryPriority;

  // Relacionamentos
  @ManyToOne(() => Customer, customer => customer.deliveries, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column('uuid', { comment: 'ID do cliente' })
  customer_id!: string;

  @ManyToOne(() => Driver, driver => driver.deliveries, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: Driver;

  @Column('uuid', { nullable: true, comment: 'ID do motorista' })
  driver_id?: string;

  @ManyToOne(() => Vehicle, vehicle => vehicle.deliveries, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Column('uuid', { nullable: true, comment: 'ID do veículo' })
  vehicle_id?: string;

  // Detalhes da entrega
  @Column({
    type: 'text',
    comment: 'Descrição detalhada do produto/entrega',
  })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    comment: 'Peso da carga em kg',
  })
  weight!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Valor declarado da mercadoria',
  })
  declared_value!: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dimensões da embalagem (comprimento, largura, altura)',
  })
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit?: 'cm' | 'in';
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações adicionais do produto',
  })
  product_info?: {
    category?: string;
    fragility?: 'LOW' | 'MEDIUM' | 'HIGH';
    perishable?: boolean;
    stackable?: boolean;
    special_handling?: string[];
  };

  // Endereços
  @Column({
    type: 'jsonb',
    comment: 'Endereço de coleta',
  })
  pickup_address!: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };

  @Column({
    type: 'jsonb',
    comment: 'Endereço de entrega',
  })
  delivery_address!: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };

  // Contatos
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de contato do remetente',
  })
  sender_contact?: {
    name: string;
    phone: string;
    email?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de contato do destinatário',
  })
  recipient_contact?: {
    name: string;
    phone: string;
    email?: string;
    document?: string;
  };

  // Datas e tempos
  @Column({
    type: 'timestamp with time zone',
    comment: 'Data/hora agendada para coleta',
  })
  scheduled_pickup_at!: Date;

  @Column({
    type: 'timestamp with time zone',
    comment: 'Data/hora agendada para entrega',
  })
  scheduled_delivery_at!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora real da coleta',
  })
  actual_pickup_at?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora real da entrega',
  })
  actual_delivery_at?: Date;

  // Cálculos e métricas
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    comment: 'Distância estimada em km',
  })
  estimated_distance?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Duração estimada em minutos',
  })
  estimated_duration?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Taxa de entrega',
  })
  delivery_fee?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Custo total da entrega',
  })
  total_cost?: number;

  // Informações de pagamento
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de pagamento',
  })
  payment_info?: {
    method?: 'CASH' | 'CARD' | 'TRANSFER' | 'INVOICE';
    status?: 'PENDING' | 'PAID' | 'FAILED';
    amount?: number;
    paid_at?: Date;
    transaction_id?: string;
  };

  // Observações e instruções especiais
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Instruções especiais para coleta',
  })
  pickup_instructions?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Instruções especiais para entrega',
  })
  delivery_instructions?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais',
  })
  notes?: string;

  // Metadata e configurações
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas da entrega',
  })
  settings?: {
    requires_signature?: boolean;
    requires_photo?: boolean;
    requires_id?: boolean;
    allowed_attempt_count?: number;
    time_windows?: {
      start: string;
      end: string;
    }[];
    restricted_hours?: {
      start: string;
      end: string;
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de rastreamento em tempo real',
  })
  tracking_data?: {
    last_latitude?: number;
    last_longitude?: number;
    last_update?: Date;
    speed?: number;
    heading?: number;
    accuracy?: number;
  };

  // Relacionamentos de histórico
  @OneToMany(() => DeliveryAttempt, attempt => attempt.delivery, { cascade: true })
  attempts!: DeliveryAttempt[];

  @OneToMany(() => DeliveryProof, proof => proof.delivery, { cascade: true })
  proofs!: DeliveryProof[];

  @OneToMany(() => DeliveryStatusHistory, history => history.delivery, { cascade: true })
  statusHistory!: DeliveryStatusHistory[];
}
