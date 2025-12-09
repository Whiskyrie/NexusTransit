import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ConsentType } from '../enums/lgpdEnums';

/**
 * Entidade para gerenciar consentimentos LGPD dos usuários
 * Registra o histórico de consentimentos e revogações conforme exigido pela LGPD
 */
@Entity('user_consents')
@Index(['userId', 'consentType'], { unique: false })
@Index(['userId', 'isActive'])
@Index(['consentType', 'isActive'])
export class UserConsentEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  /** ID do usuário que deu o consentimento */
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  declare userId: string;

  /** Tipo de consentimento (marketing, geolocalização, etc.) */
  @Column({
    type: 'enum',
    enum: ConsentType,
    name: 'consent_type',
  })
  declare consentType: ConsentType;

  /** Status atual do consentimento (ativo/revogado) */
  @Column({ type: 'boolean', name: 'is_active', default: true })
  declare isActive: boolean;

  /** Versão dos termos aceitos */
  @Column({ type: 'varchar', length: 50, name: 'terms_version' })
  declare termsVersion: string;

  /** Endereço IP de onde o consentimento foi dado */
  @Column({ type: 'inet', name: 'consent_ip', nullable: true })
  declare consentIp: string;

  /** User Agent do browser usado para dar consentimento */
  @Column({ type: 'text', name: 'user_agent', nullable: true })
  declare userAgent: string;

  /** Método usado para coletar o consentimento (web, mobile, api) */
  @Column({ type: 'varchar', length: 50, name: 'collection_method', default: 'web' })
  declare collectionMethod: string;

  /** Finalidade específica para qual o consentimento foi dado */
  @Column({ type: 'text', name: 'purpose_description' })
  declare purposeDescription: string;

  /** Data de expiração do consentimento (se aplicável) */
  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  declare expiresAt: Date;

  /** Data em que o consentimento foi revogado */
  @Column({ type: 'timestamp', name: 'revoked_at', nullable: true })
  declare revokedAt: Date;

  /** Motivo da revogação (se aplicável) */
  @Column({ type: 'text', name: 'revocation_reason', nullable: true })
  declare revocationReason: string;

  /** Dados adicionais sobre o contexto do consentimento */
  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  declare metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  /**
   * Verifica se o consentimento está válido
   */
  isValid(): boolean {
    if (!this.isActive) {
      return false;
    }
    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }
    return true;
  }

  /**
   * Marca o consentimento como revogado
   */
  revoke(reason?: string): void {
    this.isActive = false;
    this.revokedAt = new Date();
    if (reason) {
      this.revocationReason = reason;
    }
  }
}
