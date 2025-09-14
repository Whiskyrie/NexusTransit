import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { DataRequestStatus, DataRequestType } from '../enums';

/**
 * Entidade para gerenciar solicitações de dados LGPD
 * Registra solicitações de portabilidade, exclusão e acesso a dados pessoais
 */
@Entity('data_requests')
@Index(['userId', 'requestType'])
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
export class DataRequestEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  /** ID do usuário que fez a solicitação */
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  declare userId: string;

  /** Tipo da solicitação (portabilidade, exclusão, acesso, etc.) */
  @Column({
    type: 'enum',
    enum: DataRequestType,
    name: 'request_type',
  })
  declare requestType: DataRequestType;

  /** Status atual da solicitação */
  @Column({
    type: 'enum',
    enum: DataRequestStatus,
    name: 'status',
    default: DataRequestStatus.PENDING,
  })
  declare status: DataRequestStatus;

  /** Motivo/justificativa da solicitação fornecida pelo usuário */
  @Column({ type: 'text', name: 'reason', nullable: true })
  declare reason: string;

  /** Endereço IP de onde a solicitação foi feita */
  @Column({ type: 'inet', name: 'request_ip', nullable: true })
  declare requestIp: string;

  /** User Agent do browser usado para fazer a solicitação */
  @Column({ type: 'text', name: 'user_agent', nullable: true })
  declare userAgent: string;

  /** Data limite para processamento (conforme LGPD) */
  @Column({ type: 'timestamp', name: 'due_date' })
  declare dueDate: Date;

  /** Data em que o processamento foi iniciado */
  @Column({ type: 'timestamp', name: 'processing_started_at', nullable: true })
  declare processingStartedAt: Date;

  /** Data em que o processamento foi concluído */
  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  declare completedAt: Date;

  /** Caminho do arquivo gerado (para portabilidade de dados) */
  @Column({ type: 'varchar', length: 500, name: 'file_path', nullable: true })
  declare filePath: string;

  /** Hash do arquivo gerado para verificação de integridade */
  @Column({ type: 'varchar', length: 128, name: 'file_hash', nullable: true })
  declare fileHash: string;

  /** Tamanho do arquivo em bytes */
  @Column({ type: 'bigint', name: 'file_size', nullable: true })
  declare fileSize: number;

  /** Mensagem de erro em caso de falha no processamento */
  @Column({ type: 'text', name: 'error_message', nullable: true })
  declare errorMessage: string;

  /** ID do administrador que processou a solicitação */
  @Column({ type: 'uuid', name: 'processed_by', nullable: true })
  declare processedBy: string;

  /** Observações administrativas sobre o processamento */
  @Column({ type: 'text', name: 'admin_notes', nullable: true })
  declare adminNotes: string;

  /** Dados adicionais específicos da solicitação */
  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  declare metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  /**
   * Verifica se a solicitação está dentro do prazo legal
   */
  isWithinLegalDeadline(): boolean {
    return new Date() <= this.dueDate;
  }

  /**
   * Verifica se a solicitação expirou
   */
  isExpired(): boolean {
    return new Date() > this.dueDate && this.status === DataRequestStatus.PENDING;
  }

  /**
   * Marca a solicitação como iniciada
   */
  startProcessing(processedBy: string): void {
    this.status = DataRequestStatus.PROCESSING;
    this.processingStartedAt = new Date();
    this.processedBy = processedBy;
  }

  /**
   * Marca a solicitação como concluída
   */
  complete(filePath?: string, fileHash?: string, fileSize?: number): void {
    this.status = DataRequestStatus.COMPLETED;
    this.completedAt = new Date();
    if (filePath) {
      this.filePath = filePath;
    }
    if (fileHash) {
      this.fileHash = fileHash;
    }
    if (fileSize) {
      this.fileSize = fileSize;
    }
  }

  /**
   * Marca a solicitação como falha
   */
  fail(errorMessage: string): void {
    this.status = DataRequestStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  /**
   * Cancela a solicitação
   */
  cancel(): void {
    this.status = DataRequestStatus.CANCELLED;
  }

  /**
   * Marca a solicitação como expirada
   */
  expire(): void {
    this.status = DataRequestStatus.EXPIRED;
  }
}
