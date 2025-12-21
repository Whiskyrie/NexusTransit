import { IsEnum, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuditFilterDto } from "./audit-filter.dto";

export enum ExportFormat {
  CSV = "csv",
  JSON = "json",
}

export class AuditExportDto extends AuditFilterDto {
  @ApiProperty({
    description: "Formato de exportação",
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @ApiPropertyOptional({
    description: "Incluir valores antigos",
    example: true,
    default: true,
  })
  @IsOptional()
  includeOldValues?: boolean = true;

  @ApiPropertyOptional({
    description: "Incluir valores novos",
    example: true,
    default: true,
  })
  @IsOptional()
  includeNewValues?: boolean = true;

  @ApiPropertyOptional({
    description: "Incluir metadata",
    example: false,
    default: false,
  })
  @IsOptional()
  includeMetadata?: boolean = false;
}
