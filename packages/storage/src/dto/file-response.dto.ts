import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO para resposta de arquivo
 */
export class FileResponseDto {
  @ApiProperty({
    description: "Caminho do arquivo",
    example: "documents/2025/12/abc123.pdf",
  })
  filePath: string;

  @ApiProperty({
    description: "Hash do arquivo",
    example: "abc123-def456-ghi789",
  })
  fileHash: string;

  @ApiProperty({
    description: "URL do arquivo",
    example: "http://localhost:3000/uploads/documents/2025/12/abc123.pdf",
  })
  url: string;

  @ApiProperty({
    description: "Metadados do arquivo",
    type: "object",
    additionalProperties: true,
  })
  metadata: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
