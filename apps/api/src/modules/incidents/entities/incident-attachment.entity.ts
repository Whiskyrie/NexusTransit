import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Incident } from './incident.entity';
import { User } from '../../users/entities/user.entity';
import { Auditable } from '@nexus/audit';

export enum IncidentAttachmentType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
}

@Entity('incident_attachments')
@Auditable({
  trackCreation: true,
  trackUpdates: false,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at', 'deleted_at'],
  entityDisplayName: 'Anexo de Incidente',
})
export class IncidentAttachment extends BaseEntity {
  @ManyToOne(() => Incident, incident => incident.attachments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incident_id' })
  incident!: Incident;

  @Column({ type: 'uuid' })
  incident_id!: string;

  @Column({
    type: 'enum',
    enum: IncidentAttachmentType,
    comment: 'Tipo do anexo',
  })
  file_type!: IncidentAttachmentType;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'URL do arquivo armazenado no Backblaze B2',
  })
  file_url!: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome original do arquivo',
  })
  file_name!: string;

  @Column({
    type: 'integer',
    comment: 'Tamanho do arquivo em bytes',
  })
  file_size!: number;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Tipo MIME do arquivo',
  })
  mime_type!: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição do anexo',
  })
  description?: string;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploaded_by?: User;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by_user_id?: string | null;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Data e hora do upload',
  })
  uploaded_at!: Date;
}
