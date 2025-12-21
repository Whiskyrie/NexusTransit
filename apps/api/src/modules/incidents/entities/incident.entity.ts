import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Route } from '../../routes/entities/route.entity';
import { User } from '../../users/entities/user.entity';
import { IncidentAttachment } from './incident-attachment.entity';
import { IncidentComment } from './incident-comment.entity';
import { IncidentStatus, IncidentSeverity, IncidentType } from '../enums/incident.enums';
import { Auditable } from '@nexus/audit';

@Entity('incidents')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at', 'deleted_at'],
  entityDisplayName: 'Incidente',
})
export class Incident extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'Número único do incidente gerado automaticamente',
  })
  @Index()
  incident_number!: string;

  @ManyToOne(() => Delivery, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'delivery_id' })
  delivery?: Delivery;

  @Column({ type: 'uuid', nullable: true })
  delivery_id?: string;

  @ManyToOne(() => Route, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'route_id' })
  route?: Route;

  @Column({ type: 'uuid', nullable: true })
  route_id?: string;

  @ManyToOne(() => Driver, {
    nullable: false,
  })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  @Column({ type: 'uuid' })
  driver_id!: string;

  @ManyToOne(() => Vehicle, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Column({ type: 'uuid', nullable: true })
  vehicle_id?: string;

  @Column({
    type: 'enum',
    enum: IncidentType as Record<string, string>,
    comment: 'Tipo do incidente',
  })
  @Index()
  incident_type!: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity as Record<string, string>,
    comment: 'Severidade do incidente',
  })
  @Index()
  severity!: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus as Record<string, string>,
    default: 'REPORTED',
    comment: 'Status atual do incidente',
  })
  @Index()
  status!: IncidentStatus;

  @Column({
    type: 'varchar',
    length: 200,
    comment: 'Título breve do incidente',
  })
  title!: string;

  @Column({
    type: 'text',
    comment: 'Descrição detalhada do incidente',
  })
  description!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    comment: 'Localização geográfica do incidente (PostGIS Point)',
  })
  location?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Endereço formatado do local do incidente',
  })
  location_address?: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Data e hora do registro do incidente',
  })
  reported_at!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data e hora da ocorrência do incidente',
  })
  occurred_at?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data e hora da resolução do incidente',
  })
  resolved_at?: Date;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'reported_by_user_id' })
  reported_by!: User;

  @Column({ type: 'uuid' })
  reported_by_user_id!: string;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assigned_to?: User;

  @Column({ type: 'uuid', nullable: true })
  assigned_to_user_id?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas sobre a resolução do incidente',
  })
  resolution_notes?: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Estimativa de prejuízo financeiro',
  })
  estimated_loss?: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o incidente afetou entregas',
  })
  impact_on_delivery!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se é necessário acionar seguro',
  })
  requires_insurance!: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais sobre o incidente',
  })
  notes?: string;

  @OneToMany(() => IncidentAttachment, attachment => attachment.incident, {
    cascade: true,
  })
  attachments?: IncidentAttachment[];

  @OneToMany(() => IncidentComment, comment => comment.incident, {
    cascade: true,
  })
  comments?: IncidentComment[];
}
