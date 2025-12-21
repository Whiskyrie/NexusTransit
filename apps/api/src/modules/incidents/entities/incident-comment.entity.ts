import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Incident } from './incident.entity';
import { User } from '../../users/entities/user.entity';
import { Auditable } from '@nexus/audit';

@Entity('incident_comments')
@Auditable({
  trackCreation: true,
  trackUpdates: false,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at', 'deleted_at'],
  entityDisplayName: 'Comentário de Incidente',
})
export class IncidentComment extends BaseEntity {
  @ManyToOne(() => Incident, incident => incident.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incident_id' })
  incident!: Incident;

  @Column({ type: 'uuid' })
  incident_id!: string;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({
    type: 'text',
    comment: 'Texto do comentário',
  })
  comment_text!: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Visível apenas internamente',
  })
  is_internal!: boolean;
}
