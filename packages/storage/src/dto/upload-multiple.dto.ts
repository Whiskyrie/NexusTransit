import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/**
 * DTO para upload múltiplo de arquivos
 */
export class UploadMultipleDto {
  @ApiProperty({ type: "array", items: { type: "string", format: "binary" } })
  files: Express.Multer.File[];

  @ApiPropertyOptional({
    description: "Tipo de arquivo",
    enum: ["documents", "images", "proofs", "temp"],
    example: "documents",
  })
  @IsOptional()
  @IsString()
  fileType?: "documents" | "images" | "proofs" | "temp";

  @ApiPropertyOptional({
    description: "ID do usuário",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
