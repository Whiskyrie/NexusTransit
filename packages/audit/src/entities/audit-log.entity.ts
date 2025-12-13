import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "@nexus/common";
import { AuditAction, AuditCategory } from "../enums";

@Entity("audit_logs")
@Index(["userId", "created_at"])
@Index(["action", "created_at"])
@Index(["category", "created_at"])
@Index(["created_at"])
export class AuditLogEntity extends BaseEntity {
  @Column({ type: "enum", enum: AuditAction })
  action!: AuditAction;

  @Column({ type: "enum", enum: AuditCategory })
  category!: AuditCategory;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  @Index()
  userId!: string | null;

  @Column({ name: "user_email", type: "varchar", length: 255, nullable: true })
  userEmail!: string | null;

  @Column({ name: "user_role", type: "varchar", length: 100, nullable: true })
  userRole!: string | null;

  @Column({ name: "resource_type", type: "varchar", length: 100 })
  resourceType!: string;

  @Column({ name: "resource_id", type: "varchar", length: 255, nullable: true })
  resourceId!: string | null;

  @Column({ name: "ip_address", type: "inet", nullable: true })
  ipAddress!: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent!: string | null;

  @Column({
    name: "request_method",
    type: "varchar",
    length: 10,
    nullable: true,
  })
  requestMethod!: string | null;

  @Column({ name: "request_url", type: "text", nullable: true })
  requestUrl!: string | null;

  @Column({ name: "status_code", type: "integer", nullable: true })
  statusCode!: number | null;

  @Column({ name: "execution_time_ms", type: "integer", nullable: true })
  executionTimeMs!: number | null;

  @Column({ name: "old_values", type: "jsonb", nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ name: "new_values", type: "jsonb", nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: "description", type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "failure_reason", type: "text", nullable: true })
  failureReason!: string | null;
}
