import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Vehicle } from './vehicle.entity';
import { DocumentType } from '../dto/document.dto';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * VehicleDocument Entity - Documentos dos veículos
 *
 * Gerencia todos os documentos associados aos veículos:
 * - CRLV (Certificado de Registro e Licenciamento de Veículo)
 * - Seguro obrigatório e facultativo
 * - IPVA
 * - Certificados de inspeção
 * - Outros documentos relevantes
 */
@Entity('vehicle_documents')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Documento do Veículo',
})
export class VehicleDocument extends BaseEntity {
  @Column({
    type: 'enum',
    enum: DocumentType,
    comment: 'Tipo do documento (CRLV, Seguro, IPVA, etc.)',
  })
  document_type!: DocumentType;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome original do arquivo enviado',
  })
  original_name!: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Caminho completo do arquivo no storage',
  })
  file_path!: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Tamanho do arquivo formatado (ex: 2.5 MB)',
  })
  file_size!: string;

  @Column({
    type: 'integer',
    comment: 'Tamanho do arquivo em bytes',
  })
  file_size_bytes!: number;

  @Column({
    type: 'varchar',
    length: 10,
    comment: 'Extensão do arquivo (pdf, jpg, png, etc.)',
  })
  file_extension!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'MIME type do arquivo',
  })
  mime_type!: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de expiração do documento',
  })
  expiry_date?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição ou observações sobre o documento',
  })
  description?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o documento está ativo (não foi removido)',
  })
  is_active!: boolean;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'Hash SHA-256 do arquivo para verificação de integridade',
  })
  file_hash?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais do arquivo (dimensões para imagens, etc.)',
  })
  metadata?: Record<string, unknown>;

  // Relacionamento com Vehicle
  @ManyToOne(() => Vehicle, vehicle => vehicle.documents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column('uuid')
  vehicle_id!: string;

  // Computed properties

  /**
   * Verifica se o documento está próximo do vencimento (30 dias)
   */
  get is_expiring_soon(): boolean {
    if (!this.expiry_date) {
      return false;
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return this.expiry_date <= thirtyDaysFromNow && this.expiry_date >= today;
  }

  /**
   * Verifica se o documento está vencido
   */
  get is_expired(): boolean {
    if (!this.expiry_date) {
      return false;
    }

    return this.expiry_date < new Date();
  }

  /**
   * Retorna o status do documento
   */
  get status(): 'active' | 'expiring_soon' | 'expired' | 'inactive' {
    if (!this.is_active) {
      return 'inactive';
    }

    if (this.is_expired) {
      return 'expired';
    }

    if (this.is_expiring_soon) {
      return 'expiring_soon';
    }

    return 'active';
  }

  /**
   * Gera URL de download segura (placeholder para implementação futura)
   */
  get download_url(): string {
    // TODO: Implementar geração de URL assinada para Backblaze B2
    return `/vehicles/${this.vehicle_id}/documents/${this.id}/download`;
  }
}
