import { Entity, Column, CreateDateColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { AuditAction, AuditCategory } from '../enums';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['category', 'createdAt'])
@Index(['createdAt'])
export class AuditLogEntity extends BaseEntity {
  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'enum', enum: AuditCategory })
  category!: AuditCategory;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId!: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail!: string | null;

  @Column({ name: 'user_role', type: 'varchar', length: 100, nullable: true })
  userRole!: string | null;

  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId!: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'request_method', type: 'varchar', length: 10, nullable: true })
  requestMethod!: string | null;

  @Column({ name: 'request_url', type: 'text', nullable: true })
  requestUrl!: string | null;

  @Column({ name: 'status_code', type: 'integer', nullable: true })
  statusCode!: number | null;

  @Column({ name: 'execution_time_ms', type: 'integer', nullable: true })
  executionTimeMs!: number | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId!: string | null;

  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  correlationId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // LGPD compliance fields
  @Column({ name: 'data_subject_id', type: 'uuid', nullable: true })
  dataSubjectId!: string | null;

  @Column({ name: 'legal_basis', type: 'varchar', length: 100, nullable: true })
  legalBasis!: string | null;

  @Column({ name: 'sensitive_data', type: 'boolean', default: false })
  sensitiveData!: boolean;

  @Column({ name: 'retention_period_days', type: 'integer', nullable: true })
  retentionPeriodDays!: number | null;
}
