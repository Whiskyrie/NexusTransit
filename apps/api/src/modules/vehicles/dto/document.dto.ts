import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  CRLV = 'crlv',
  INSURANCE = 'insurance',
  IPVA = 'ipva',
  REGISTRATION = 'registration',
  DRIVER_LICENSE = 'driver_license',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Tipo do documento',
    enum: DocumentType,
    example: DocumentType.CRLV,
  })
  @IsEnum(DocumentType)
  document_type: DocumentType = DocumentType.CRLV;

  @ApiPropertyOptional({
    description: 'Data de expiração do documento',
    example: '2024-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({
    description: 'Descrição adicional do documento',
    example: 'CRLV atualizado em 2023',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'ID único do documento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Tipo do documento',
    enum: DocumentType,
    example: DocumentType.CRLV,
  })
  document_type: DocumentType = DocumentType.CRLV;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'crlv_veiculo.pdf',
  })
  original_name!: string;

  @ApiProperty({
    description: 'Caminho do arquivo no storage',
    example: 'vehicles/documents/2023/12/550e8400-e29b-41d4-a716-446655440000.pdf',
  })
  file_path!: string;

  @ApiProperty({
    description: 'Tamanho do arquivo',
    example: '2.5 MB',
  })
  file_size!: string;

  @ApiProperty({
    description: 'Extensão do arquivo',
    example: 'pdf',
  })
  file_extension!: string;

  @ApiPropertyOptional({
    description: 'Data de expiração do documento',
    example: '2024-12-31T00:00:00.000Z',
  })
  expiry_date?: Date;

  @ApiPropertyOptional({
    description: 'Descrição do documento',
    example: 'CRLV atualizado em 2023',
  })
  description?: string;

  @ApiProperty({
    description: 'Indica se o documento está ativo',
    example: true,
  })
  is_active = false;

  @ApiProperty({
    description: 'Data de upload',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-01-15T00:00:00.000Z',
  })
  updated_at!: Date;
}
