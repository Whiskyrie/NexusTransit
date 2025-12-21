import { ApiProperty } from "@nestjs/swagger";
import { FileMetadataDto } from "./file-metadata.dto";

/**
 * DTO para resposta paginada de arquivos
 */
export class PaginatedFileResponseDto {
  @ApiProperty({
    description: "Lista de arquivos",
    type: [FileMetadataDto],
  })
  data: FileMetadataDto[];

  @ApiProperty({
    description: "Metadados de paginação",
    type: "object",
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
  };
}
