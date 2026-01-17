import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '@nexus/common';
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
@Index('IDX_ATTEMPT_DELIVERY', ['delivery_id'])
@Index('IDX_ATTEMPT_DRIVER', ['driver_id'])
@Index('IDX_ATTEMPT_DATE', ['attempt_date'])
@Index('IDX_ATTEMPT_RESULT', ['result'])
@Index('IDX_ATTEMPT_DELIVERY_NUMBER', ['delivery_id', 'attempt_number'])
export class DeliveryAttempt extends BaseEntity {
  @Column({
    type: 'integer',
    comment: 'Número sequencial da tentativa',
  })
  attempt_number!: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Data/hora da tentativa',
  })
  attempt_date!: Date;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Resultado da tentativa (SUCCESS, FAILED, etc)',
  })
  result!: string;

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
    comment: 'Observações da tentativa',
  })
  notes?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    comment: 'Latitude da localização',
  })
  location_latitude?: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    comment: 'Longitude da localização',
  })
  location_longitude?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Precisão do GPS em metros',
  })
  location_accuracy?: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Evidências coletadas durante a tentativa (fotos, etc)',
  })
  evidence?: {
    photos?: string[];
    videos?: string[];
    audio_notes?: string[];
    documents?: string[];
  };

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome da pessoa contatada',
  })
  contact_name?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone da pessoa contatada',
  })
  contact_phone?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Relação com o destinatário',
  })
  contact_relationship?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora agendada para próxima tentativa',
  })
  next_attempt_scheduled_at?: Date;

  // Relacionamentos
  @ManyToOne(() => Delivery, delivery => delivery.attempts, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'delivery_id' })
  delivery!: Delivery;

  @Column('uuid', { comment: 'ID da entrega' })
  delivery_id!: string;

  @ManyToOne(() => Driver, driver => driver.delivery_attempts, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  @Column('uuid', { comment: 'ID do motorista' })
  driver_id!: string;
}
