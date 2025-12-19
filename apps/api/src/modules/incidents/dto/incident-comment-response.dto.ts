import { ApiProperty } from '@nestjs/swagger';

export class IncidentCommentResponseDto {
  @ApiProperty({
    description: 'ID único do comentário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID do incidente relacionado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  incident_id!: string;

  @ApiProperty({
    description: 'ID do usuário que comentou',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  user_id!: string;

  @ApiProperty({
    description: 'Texto do comentário',
    example: 'O incidente está sendo investigado',
  })
  comment_text!: string;

  @ApiProperty({
    description: 'Comentário interno (visível apenas para equipe)',
    example: false,
  })
  is_internal!: boolean;

  @ApiProperty({
    description: 'Data e hora do comentário',
    example: '2024-12-16T14:30:00Z',
  })
  created_at!: Date;
}
