import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { FailureReason } from '../enums/failure-reason.enum';
import { Delivery } from './delivery.entity';
import { Driver } from '../../drivers/entities/driver.entity';

/**
 * DeliveryAttempt Entity - Registro de tentativas de entrega
 *
 * Features:
 * - Histórico completo de tentativas
 * - Registro de motivos de falha
 * - Controle de número máximo de tentativas
 * - Geolocalização das tentativas
 */
@Entity('delivery_attempts')
@Index(['delivery_id'])
@Index(['attempt_number'])
@Index(['status'])
@Index(['started_at'])
export class DeliveryAttempt extends BaseEntity {
  @Column({
    type: 'integer',
    comment: 'Número sequencial da tentativa',
  })
  attempt_number!: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    comment: 'Status da tentativa',
  })
  status!: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

  @Column({
    type: 'timestamp with time zone',
    comment: 'Data/hora de início da tentativa',
  })
  started_at!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora de conclusão da tentativa',
  })
  completed_at?: Date;

  @Column({
    type: 'enum',
    enum: FailureReason,
    nullable: true,
    comment: 'Motivo da falha (se aplicável)',
  })
  failure_reason?: FailureReason;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada da falha',
  })
  failure_description?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Localização da tentativa',
  })
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    timestamp: Date;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de contato durante a tentativa',
  })
  contact_info?: {
    contacted_person?: string;
    phone?: string;
    email?: string;
    relationship?: 'RECIPIENT' | 'FAMILY' | 'NEIGHBOR' | 'OTHER';
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Observações da tentativa',
  })
  notes?: {
    internal_notes?: string;
    customer_notes?: string;
    driver_notes?: string;
    weather_conditions?: string;
    traffic_conditions?: string;
    access_issues?: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Evidências coletadas durante a tentativa',
  })
  evidence?: {
    photos?: string[];
    videos?: string[];
    audio_notes?: string[];
    documents?: string[];
    gps_tracks?: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      speed?: number;
    }[];
  };

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o cliente foi contatado',
  })
  customer_contacted!: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora do contato com o cliente',
  })
  customer_contacted_at?: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Método de contato utilizado',
  })
  contact_method?: 'PHONE' | 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON';

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Próxima ação recomendada',
  })
  next_action?: {
    type: 'RETRY' | 'RESCHEDULE' | 'CANCEL' | 'ESCALATE';
    scheduled_at?: Date;
    reason?: string;
    assigned_to?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados do motorista durante a tentativa',
  })
  driver_data?: {
    driver_id: string;
    vehicle_id?: string;
    vehicle_odometer?: number;
    fuel_level?: number;
  };

  // Relacionamentos
  @ManyToOne(() => Delivery, delivery => delivery.attempts, { nullable: false })
  @JoinColumn({ name: 'delivery_id' })
  delivery!: Delivery;

  @Column('uuid', { comment: 'ID da entrega' })
  delivery_id!: string;

  @ManyToOne(() => Driver, driver => driver.delivery_attempts, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: Driver;

  @Column('uuid', { nullable: true, comment: 'ID do motorista' })
  driver_id?: string;
}
