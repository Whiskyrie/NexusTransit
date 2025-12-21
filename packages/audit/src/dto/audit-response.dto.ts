import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { AuditAction, AuditCategory } from "../enums";

export class AuditResponseDto {
  @ApiProperty({
    description: "ID único do log de auditoria",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id!: string;

  @ApiProperty({
    description: "Ação executada",
    enum: AuditAction,
    example: AuditAction.UPDATE,
  })
  action!: AuditAction;

  @ApiProperty({
    description: "Categoria da auditoria",
    enum: AuditCategory,
    example: AuditCategory.SYSTEM,
  })
  category!: AuditCategory;

  @ApiPropertyOptional({
    description: "ID do usuário que executou a ação",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  userId!: string | null;

  @ApiPropertyOptional({
    description: "Email do usuário",
    example: "usuario@example.com",
  })
  userEmail!: string | null;

  @ApiPropertyOptional({
    description: "Role/papel do usuário",
    example: "admin",
  })
  userRole!: string | null;

  @ApiProperty({
    description: "Tipo de recurso/entidade",
    example: "Vehicle",
  })
  resourceType!: string;

  @ApiPropertyOptional({
    description: "ID do recurso",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  resourceId!: string | null;

  @ApiPropertyOptional({
    description: "Endereço IP de origem",
    example: "192.168.1.1",
  })
  ipAddress!: string | null;

  @ApiPropertyOptional({
    description: "User-Agent do navegador/aplicativo",
    example: "Mozilla/5.0...",
  })
  userAgent!: string | null;

  @ApiPropertyOptional({
    description: "Método HTTP da requisição",
    example: "PATCH",
  })
  requestMethod!: string | null;

  @ApiPropertyOptional({
    description: "URL da requisição",
    example: "/api/vehicles/123",
  })
  requestUrl!: string | null;

  @ApiPropertyOptional({
    description: "Status code da resposta HTTP",
    example: 200,
  })
  statusCode!: number | null;

  @ApiPropertyOptional({
    description: "Tempo de execução em milissegundos",
    example: 125,
  })
  executionTimeMs!: number | null;

  @ApiPropertyOptional({
    description: "Valores anteriores (antes da alteração)",
    example: { status: "ACTIVE", plate: "ABC-1234" },
  })
  oldValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "Novos valores (após a alteração)",
    example: { status: "INACTIVE", plate: "ABC-1234" },
  })
  newValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "Metadata adicional",
    example: { reason: "Manutenção programada" },
  })
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "Descrição legível da ação",
    example: "Atualizado Veículo",
  })
  description!: string | null;

  @ApiPropertyOptional({
    description: "Razão de falha (se houver)",
    example: null,
  })
  failureReason!: string | null;

  @ApiProperty({
    description: "Data de criação do log",
    example: "2024-12-21T10:30:00Z",
  })
  created_at!: Date;

  @ApiProperty({
    description: "Data de atualização do log",
    example: "2024-12-21T10:30:00Z",
  })
  updated_at!: Date;

  /**
   * Retorna lista de campos que foram modificados
   */
  @ApiPropertyOptional({
    description: "Lista de campos modificados",
    example: ["status"],
    type: [String],
  })
  @Expose()
  get changedFields(): string[] {
    if (!this.oldValues || !this.newValues) return [];

    const oldKeys = Object.keys(this.oldValues);
    const newKeys = Object.keys(this.newValues);
    const allKeys = [...new Set([...oldKeys, ...newKeys])];

    return allKeys.filter((key) => {
      const oldValue = JSON.stringify(this.oldValues?.[key]);
      const newValue = JSON.stringify(this.newValues?.[key]);
      return oldValue !== newValue;
    });
  }
}
