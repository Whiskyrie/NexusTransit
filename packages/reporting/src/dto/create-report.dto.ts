import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  IsArray,
  Length,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportType, ReportFormat, ReportPeriod } from "../enums/report-type.enum";

/**
 * DTO para criação de relatório
 */
export class CreateReportDto {
  @ApiProperty({
    description: "Tipo do relatório",
    enum: ReportType,
    example: ReportType.DELIVERIES,
  })
  @IsEnum(ReportType)
  @IsNotEmpty()
  type!: ReportType;

  @ApiProperty({
    description: "Título do relatório",
    example: "Relatório de Entregas - Dezembro 2024",
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  title!: string;

  @ApiPropertyOptional({
    description: "Descrição do relatório",
    example: "Relatório detalhado das entregas realizadas no mês",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: "Período do relatório",
    enum: ReportPeriod,
    example: ReportPeriod.THIS_MONTH,
  })
  @IsEnum(ReportPeriod)
  @IsNotEmpty()
  period!: ReportPeriod;

  @ApiProperty({
    description: "Data de início do período",
    example: "2024-12-01T00:00:00Z",
  })
  @IsDateString()
  @IsNotEmpty()
  start_date!: string;

  @ApiProperty({
    description: "Data de fim do período",
    example: "2024-12-31T23:59:59Z",
  })
  @IsDateString()
  @IsNotEmpty()
  end_date!: string;

  @ApiProperty({
    description: "Formato de exportação desejado",
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  @IsNotEmpty()
  format!: ReportFormat;

  @ApiPropertyOptional({
    description: "Filtros aplicados ao relatório",
    example: { status: "COMPLETED", priority: "HIGH" },
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Campos a serem incluídos no relatório",
    example: ["tracking_code", "customer_name", "status", "delivery_date"],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({
    description: "Métricas a serem calculadas",
    example: ["total_deliveries", "average_time", "success_rate"],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @ApiPropertyOptional({
    description: "Agrupar dados por campo(s)",
    example: ["driver_id", "status"],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  group_by?: string[];

  @ApiPropertyOptional({
    description: "Ordenar resultados por campo(s)",
    example: [{ field: "delivery_date", direction: "DESC" }],
  })
  @IsOptional()
  order_by?: Array<{ field: string; direction: "ASC" | "DESC" }>;

  @ApiPropertyOptional({
    description: "Incluir gráficos no relatório",
    example: true,
    default: false,
  })
  @IsOptional()
  include_charts?: boolean;

  @ApiPropertyOptional({
    description: "Incluir resumo executivo",
    example: true,
    default: true,
  })
  @IsOptional()
  include_summary?: boolean;

  @ApiPropertyOptional({
    description: "Configurar relatório como recorrente",
    example: false,
    default: false,
  })
  @IsOptional()
  is_recurring?: boolean;

  @ApiPropertyOptional({
    description: "Metadados adicionais do relatório",
    example: { department: "operations", requester: "manager@company.com" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
