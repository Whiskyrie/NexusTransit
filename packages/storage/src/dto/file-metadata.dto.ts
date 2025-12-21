import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO para metadados de arquivo
 */
export class FileMetadataDto {
  @ApiProperty({
    description: "Nome do arquivo",
    example: "abc123.pdf",
  })
  filename: string;

  @ApiProperty({
    description: "Nome original do arquivo",
    example: "contrato.pdf",
  })
  originalName: string;

  @ApiProperty({
    description: "Tamanho do arquivo em bytes",
    example: 1024,
  })
  size: number;

  @ApiProperty({
    description: "Tipo MIME do arquivo",
    example: "application/pdf",
  })
  mimeType: string;

  @ApiPropertyOptional({
    description: "Largura da imagem (se aplicável)",
    example: 800,
  })
  width?: number;

  @ApiPropertyOptional({
    description: "Altura da imagem (se aplicável)",
    example: 600,
  })
  height?: number;

  @ApiPropertyOptional({
    description: "Data de criação",
    example: "2025-01-01T00:00:00Z",
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: "Data de atualização",
    example: "2025-01-01T00:00:00Z",
  })
  updatedAt?: Date;
}
