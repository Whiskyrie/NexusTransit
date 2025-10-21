import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Auditable } from '../../vehicles/decorators/auditable.decorator';

/**
 * Tracking Entity - Sistema de rastreamento em tempo real
 *
 * Features:
 * - Rastreamento GPS de veículos e entregas
 * - Histórico completo de localizações
 * - Métricas de velocidade, direção e precisão
 * - Integração com entregas, veículos e motoristas
 * - Geolocalização avançada
 */
@Entity('tracking')
@Index(['delivery_id'])
@Index(['vehicle_id'])
@Index(['driver_id'])
@Index(['recorded_at'])
@Index(['latitude', 'longitude'])
@Auditable({
  trackCreation: true,
  trackUpdates: false,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Rastreamento',
})
export class Tracking extends BaseEntity {
  // Relacionamentos
  @ManyToOne(() => Delivery, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_id' })
  delivery?: Delivery;

  @Column('uuid', { nullable: true, comment: 'ID da entrega sendo rastreada' })
  delivery_id?: string;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Column('uuid', { nullable: true, comment: 'ID do veículo sendo rastreado' })
  vehicle_id?: string;

  @ManyToOne(() => Driver, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver?: Driver;

  @Column('uuid', { nullable: true, comment: 'ID do motorista' })
  driver_id?: string;

  // Coordenadas GPS
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    comment: 'Latitude da posição (-90 a 90)',
  })
  latitude!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    comment: 'Longitude da posição (-180 a 180)',
  })
  longitude!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Altitude em metros',
  })
  altitude?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Precisão da localização em metros',
  })
  accuracy?: number;

  // Métricas de movimento
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    comment: 'Velocidade em km/h',
  })
  speed?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Direção em graus (0-360)',
  })
  heading?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Distância percorrida desde o último ponto (em km)',
  })
  distance_from_previous?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo decorrido desde o último ponto (em segundos)',
  })
  time_from_previous?: number;

  // Informações do dispositivo
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Identificador do dispositivo GPS',
  })
  device_id?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tipo de dispositivo (GPS, Mobile, etc)',
  })
  device_type?: string;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Nível de bateria do dispositivo (0-100)',
  })
  battery_level?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Intensidade do sinal GPS (0-100)',
  })
  signal_strength?: number;

  // Contexto e metadados
  @Column({
    type: 'timestamp with time zone',
    comment: 'Data/hora exata da captura da localização',
  })
  recorded_at!: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Evento que gerou o registro (inicio_rota, parada, entrega, etc)',
  })
  event_type?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas ou observações sobre o ponto',
  })
  notes?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Endereço aproximado da localização',
  })
  address?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cidade',
  })
  city?: string;

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
    comment: 'Estado (UF)',
  })
  state?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'País',
  })
  country?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'CEP',
  })
  postal_code?: string;

  // Dados adicionais
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados adicionais específicos do contexto',
  })
  metadata?: {
    weather?: {
      temperature?: number;
      conditions?: string;
    };
    traffic?: {
      level?: string;
      incidents?: string[];
    };
    geofence?: {
      zone_id?: string;
      zone_name?: string;
      entry_exit?: 'entry' | 'exit';
    };
    sensors?: {
      temperature?: number;
      humidity?: number;
      pressure?: number;
    };
    custom?: Record<string, any>;
  };

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o ponto é válido',
  })
  is_valid!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se houve uma parada neste ponto',
  })
  is_stop!: boolean;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Duração da parada em minutos',
  })
  stop_duration?: number;
}
