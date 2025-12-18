import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Auditable } from '@nexus/audit';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Route } from '../../routes/entities/route.entity';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

/**
 * Entidade de Evento de Rastreamento
 *
 * Registra eventos individuais durante o processo de entrega
 * com suporte a geolocalização PostGIS
 */
@Entity('tracking_events')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Tracking Event',
})
@Index(['delivery_id', 'timestamp'])
@Index(['driver_id', 'timestamp'])
@Index(['route_id', 'timestamp'])
@Index(['event_type'])
@Index(['event_status'])
export class TrackingEvent extends BaseEntity {
  @Column({
    type: 'uuid',
    unique: true,
    comment: 'ID único do evento',
  })
  event_id!: string;

  @ManyToOne(() => Delivery, delivery => delivery.tracking_events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_id' })
  delivery!: Delivery;

  @Column({
    type: 'uuid',
    comment: 'ID da entrega',
  })
  delivery_id!: string;

  @ManyToOne(() => Route, route => route.tracking_events, { nullable: true })
  @JoinColumn({ name: 'route_id' })
  route?: Route;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID da rota',
  })
  route_id?: string;

  @ManyToOne(() => Driver, driver => driver.tracking_events)
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  @Column({
    type: 'uuid',
    comment: 'ID do motorista',
  })
  driver_id!: string;

  @Column({
    type: 'enum',
    enum: EventType,
    comment: 'Tipo do evento de rastreamento',
  })
  event_type!: EventType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    comment: 'Status do evento',
  })
  event_status!: EventStatus;

  @Column({
    type: 'timestamp with time zone',
    comment: 'Data/hora do evento',
  })
  timestamp!: Date;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    comment: 'Coordenadas geográficas do evento (PostGIS)',
  })
  location?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Endereço formatado',
  })
  location_address?: string;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Precisão do GPS em metros',
  })
  accuracy?: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Velocidade em km/h',
  })
  speed?: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Nível de bateria do dispositivo (0-100)',
  })
  battery_level?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações do evento',
  })
  notes?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais',
  })
  metadata?: Record<string, unknown>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Evento automático vs manual',
  })
  is_automatic!: boolean;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Usuário que criou evento manual',
  })
  created_by_user_id?: string;

  /**
   * Obtém as coordenadas de latitude e longitude do evento
   */
  getCoordinates(): { latitude: number; longitude: number } | null {
    if (!this.location) {
      return null;
    }

    const match = this.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (!match) {
      return null;
    }

    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  }

  /**
   * Define as coordenadas do evento
   */
  setCoordinates(latitude: number, longitude: number): void {
    this.location = `POINT(${longitude} ${latitude})`;
  }
}
