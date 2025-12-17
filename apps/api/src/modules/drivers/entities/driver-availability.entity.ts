import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Driver } from './driver.entity';
import { AvailabilityType } from '../enums/availability-type.enum';
import { Auditable } from '@nexus/audit';

/**
 * Driver Availability Entity - Sistema de disponibilidade/ausência de motoristas
 *
 * Features:
 * - Registro de períodos de disponibilidade e indisponibilidade
 * - Controle de férias, licenças e suspensões
 * - Histórico completo de ausências
 * - Validação de períodos sobrepostos
 *
 * @example
 * // Registrar férias
 * const availability = {
 *   driver_id: 'uuid',
 *   availability_type: AvailabilityType.VACATION,
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-15',
 *   reason: 'Férias anuais',
 * };
 */
@Entity('driver_availabilities')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Disponibilidade do Motorista',
})
export class DriverAvailability extends BaseEntity {
  // ===================================
  // Relacionamento com Driver
  // ===================================

  @Column({
    type: 'uuid',
    comment: 'ID do motorista',
  })
  driver_id!: string;

  @ManyToOne(() => Driver, driver => driver.availabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  // ===================================
  // Tipo de Disponibilidade
  // ===================================

  @Column({
    type: 'enum',
    enum: AvailabilityType,
    comment: 'Tipo de disponibilidade/ausência',
  })
  availability_type!: AvailabilityType;

  // ===================================
  // Período
  // ===================================

  @Column({
    type: 'date',
    comment: 'Data de início do período',
  })
  start_date!: Date;

  @Column({
    type: 'date',
    comment: 'Data de término do período',
  })
  end_date!: Date;

  // ===================================
  // Informações Adicionais
  // ===================================

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Motivo da indisponibilidade',
  })
  reason?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações adicionais',
  })
  notes?: string;

  // ===================================
  // Status e Controle
  // ===================================

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o registro está ativo',
  })
  is_active!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se foi aprovado por um supervisor',
  })
  is_approved!: boolean;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que aprovou',
  })
  approved_by?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora da aprovação',
  })
  approved_at?: Date;

  // ===================================
  // Métodos Auxiliares
  // ===================================

  /**
   * Verifica se o período está ativo (dentro das datas)
   */
  isCurrentlyActive(): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(this.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.end_date);
    end.setHours(23, 59, 59, 999);

    return this.is_active && now >= start && now <= end;
  }

  /**
   * Verifica se o período está no futuro
   */
  isFuture(): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(this.start_date);
    start.setHours(0, 0, 0, 0);

    return start > now;
  }

  /**
   * Verifica se o período já passou
   */
  isPast(): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(this.end_date);
    end.setHours(0, 0, 0, 0);

    return end < now;
  }

  /**
   * Calcula a duração em dias
   */
  getDurationInDays(): number {
    const start = new Date(this.start_date);
    const end = new Date(this.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 para incluir o último dia
  }

  /**
   * Verifica se o tipo indica indisponibilidade
   */
  isUnavailability(): boolean {
    return this.availability_type !== AvailabilityType.AVAILABLE;
  }
}
