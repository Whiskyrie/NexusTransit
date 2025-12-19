import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentAttachmentType } from '../entities/incident-attachment.entity';

export class IncidentAttachmentResponseDto {
  @ApiProperty({
    description: 'ID único do anexo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID do incidente relacionado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  incident_id!: string;

  @ApiProperty({
    description: 'Tipo do anexo',
    enum: IncidentAttachmentType,
    example: IncidentAttachmentType.PHOTO,
  })
  file_type!: IncidentAttachmentType;

  @ApiProperty({
    description: 'URL do arquivo armazenado',
    example: 'https://storage.backblaze.com/bucket/incidents/photo.jpg',
  })
  file_url!: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'acidente.jpg',
  })
  file_name!: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 102400,
  })
  file_size!: number;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
  })
  mime_type!: string;

  @ApiPropertyOptional({
    description: 'Descrição do anexo',
    example: 'Foto do acidente',
  })
  description?: string;

  @ApiProperty({
    description: 'ID do usuário que fez o upload',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  uploaded_by_user_id!: string;

  @ApiProperty({
    description: 'Data e hora do upload',
    example: '2024-12-16T14:30:00Z',
  })
  uploaded_at!: Date;

  @ApiProperty({
    description: 'Data e hora da criação',
    example: '2024-12-16T14:30:00Z',
  })
  created_at!: Date;
}
