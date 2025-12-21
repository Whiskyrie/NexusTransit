import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsDateString, IsEnum } from "class-validator";

/**
 * DTO para filtragem de arquivos
 */
export class FileFilterDto {
  @ApiPropertyOptional({
    description: "Tipo de arquivo",
    enum: ["documents", "images", "proofs", "temp"],
    example: "documents",
  })
  @IsOptional()
  @IsEnum(["documents", "images", "proofs", "temp"])
  type?: "documents" | "images" | "proofs" | "temp";

  @ApiPropertyOptional({
    description: "Extensão do arquivo",
    example: ".pdf",
  })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiPropertyOptional({
    description: "Tipo MIME do arquivo",
    example: "image/jpeg",
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: "Termo de busca",
    example: "contrato",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Data inicial",
    example: "2025-01-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Data final",
    example: "2025-12-31",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Número da página",
    example: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Limite de itens por página",
    example: 10,
  })
  @IsOptional()
  limit?: number = 10;
}
