import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ProofType } from '../enums/proof-type.enum';
import { Delivery } from './delivery.entity';

/**
 * DeliveryProof Entity - Comprovantes de entrega
 *
 * Features:
 * - Armazenamento de diferentes tipos de comprovantes
 * - Validação de autenticidade
 * - Metadados completos de captura
 * - Integração com sistema de arquivos
 */
@Entity('delivery_proofs')
@Index(['delivery_id'])
@Index(['type'])
@Index(['captured_at'])
@Index(['verified'])
export class DeliveryProof extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ProofType,
    comment: 'Tipo do comprovante',
  })
  type!: ProofType;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Caminho do arquivo armazenado',
  })
  file_path?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome original do arquivo',
  })
  original_filename?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tamanho do arquivo formatado',
  })
  file_size?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'MIME type do arquivo',
  })
  mime_type?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Hash SHA-256 do arquivo para integridade',
  })
  file_hash?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    comment: 'Latitude da captura',
  })
  capture_latitude?: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    comment: 'Longitude da captura',
  })
  capture_longitude?: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    comment: 'Precisão do GPS em metros',
  })
  gps_accuracy?: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Data/hora da captura do comprovante',
  })
  captured_at!: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nome do recebedor',
  })
  recipient_name?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Documento do recebedor',
  })
  recipient_document?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone do recebedor',
  })
  recipient_phone?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Email do recebedor',
  })
  recipient_email?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Relação com o destinatário',
  })
  recipient_relationship?: 'SELF' | 'FAMILY' | 'FRIEND' | 'NEIGHBOR' | 'OTHER';

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados do dispositivo de captura',
  })
  device_metadata?: {
    device_type?: 'MOBILE' | 'TABLET' | 'CAMERA' | 'SCANNER';
    os?: string;
    app_version?: string;
    device_id?: string;
    ip_address?: string;
    user_agent?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de validação do comprovante',
  })
  validation_data?: {
    verified?: boolean;
    verified_at?: Date;
    verified_by?: string;
    verification_method?: 'MANUAL' | 'AUTOMATIC' | 'AI' | 'BLOCKCHAIN';
    confidence_score?: number;
    anomalies?: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados específicos por tipo de comprovante',
  })
  type_specific_data?: {
    // Para assinaturas
    signature_data?: {
      stroke_count?: number;
      duration_ms?: number;
      pressure_points?: number;
      velocity_avg?: number;
    };
    // Para fotos
    photo_data?: {
      resolution?: string;
      camera_settings?: {
        iso?: number;
        aperture?: string;
        shutter_speed?: string;
        focal_length?: string;
      };
      exif_data?: Record<string, unknown>;
    };
    // Para áudio
    audio_data?: {
      duration_seconds?: number;
      sample_rate?: number;
      bit_rate?: number;
      format?: string;
      transcription?: string;
      language?: string;
    };
    // Para códigos
    code_data?: {
      code?: string;
      generated_at?: Date;
      expires_at?: Date;
      attempts?: number;
      ip_address?: string;
    };
    // Para biometria
    biometric_data?: {
      template_id?: string;
      confidence_score?: number;
      liveness_detected?: boolean;
      anti_spoofing_passed?: boolean;
    };
  };

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações sobre o comprovante',
  })
  notes?: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o comprovante foi verificado',
  })
  verified!: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora da verificação',
  })
  verified_at?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que verificou',
  })
  verified_by?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de alterações do comprovante',
  })
  audit_trail?: {
    action: string;
    timestamp: Date;
    user_id?: string;
    details?: Record<string, unknown>;
  }[];

  // Relacionamentos
  @ManyToOne(() => Delivery, delivery => delivery.proofs, { nullable: false })
  @JoinColumn({ name: 'delivery_id' })
  delivery!: Delivery;

  @Column('uuid', { comment: 'ID da entrega' })
  delivery_id!: string;
}
