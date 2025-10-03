import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { AuditAction, AuditCategory } from '../enums/auditEnums';

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action!: AuditAction;

  @IsEnum(AuditCategory)
  category!: AuditCategory;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsString()
  resourceType!: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  requestMethod?: string;

  @IsOptional()
  @IsString()
  requestUrl?: string;

  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @IsOptional()
  @IsNumber()
  executionTimeMs?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  oldValues?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  newValues?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  correlationId?: string;

  // LGPD compliance fields
  @IsOptional()
  @IsUUID()
  dataSubjectId?: string;

  @IsOptional()
  @IsString()
  legalBasis?: string;

  @IsOptional()
  @IsBoolean()
  sensitiveData?: boolean;

  @IsOptional()
  @IsNumber()
  retentionPeriodDays?: number;
}
