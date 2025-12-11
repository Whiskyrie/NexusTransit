import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de resposta para regra de rate limiting
 */
export class RuleResponseDto {
  @ApiProperty({
    description: 'ID único da regra',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Tipo de rate limiting',
    enum: ['GLOBAL', 'IP', 'USER', 'API_KEY', 'ENDPOINT'],
    example: 'USER',
  })
  type!: string;

  @ApiProperty({
    description: 'Estratégia de rate limiting',
    enum: ['SLIDING_WINDOW', 'TOKEN_BUCKET', 'FIXED_WINDOW'],
    example: 'SLIDING_WINDOW',
  })
  strategy!: string;

  @ApiProperty({
    description: 'Número máximo de requests permitidos',
    example: 100,
  })
  limit!: number;

  @ApiProperty({
    description: 'Tamanho da janela de tempo em milissegundos',
    example: 60000,
  })
  window_size!: number;

  @ApiProperty({
    description: 'Prioridade da regra',
    example: 1,
  })
  priority!: number;

  @ApiPropertyOptional({
    description: 'Taxa de reabastecimento (Token Bucket)',
    example: 10,
  })
  refill_rate?: number;

  @ApiPropertyOptional({
    description: 'ID do role',
  })
  role_id?: string;

  @ApiPropertyOptional({
    description: 'Endpoint específico',
  })
  endpoint?: string;

  @ApiPropertyOptional({
    description: 'ID da API Key',
  })
  api_key_id?: string;

  @ApiProperty({
    description: 'Se a regra está ativa',
    example: true,
  })
  is_active!: boolean;

  @ApiPropertyOptional({
    description: 'Descrição da regra',
  })
  description?: string;

  @ApiProperty({
    description: 'Data de criação',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
  })
  updated_at!: Date;
}
