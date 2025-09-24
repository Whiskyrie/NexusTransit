import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Driver } from './driver.entity';
import { DocumentType } from '../enums/document-type.enum';

/**
 * Driver Document Entity - Sistema de documentos do motorista
 *
 * Features:
 * - Upload e gestão de documentos
 * - Controle de vencimento
 * - Validação de tipos
 * - Histórico de versões
 */
@Entity('driver_documents')
export class DriverDocument extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome do arquivo original',
  })
  filename!: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Caminho do arquivo no storage',
  })
  file_path!: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Tipo MIME do arquivo',
  })
  mime_type!: string;

  @Column({
    type: 'bigint',
    comment: 'Tamanho do arquivo em bytes',
  })
  file_size!: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
    comment: 'Tipo de documento',
  })
  document_type!: DocumentType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Descrição opcional do documento',
  })
  description?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de vencimento do documento',
  })
  expiration_date?: Date;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o documento está ativo',
  })
  is_active!: boolean;

  @Column({
    type: 'uuid',
    comment: 'ID do motorista proprietário',
  })
  driver_id!: string;

  @ManyToOne(() => Driver, driver => driver.documents)
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;
}
