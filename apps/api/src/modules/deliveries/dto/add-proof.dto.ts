import {
  IsEnum,
  IsString,
  IsOptional,
  ValidateNested,
  IsDateString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProofType } from '../enums/proof-type.enum';

/**
 * DTO para dados de foto
 */
class PhotoDataDto {
  @ApiProperty({
    description: 'URL da foto ou base64',
    example: 'https://storage.example.com/proofs/123.jpg',
  })
  @IsString()
  @Length(10, 5000)
  url!: string;

  @ApiPropertyOptional({
    description: 'Formato da imagem',
    example: 'jpeg',
  })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({
    description: 'Tamanho em bytes',
    example: 524288,
  })
  @IsOptional()
  size?: number;
}

/**
 * DTO para dados de assinatura
 */
class SignatureDataDto {
  @ApiProperty({
    description: 'Dados da assinatura (SVG ou base64)',
    example: 'data:image/svg+xml;base64,...',
  })
  @IsString()
  @Length(10, 10000)
  data!: string;

  @ApiPropertyOptional({
    description: 'Formato da assinatura',
    example: 'svg',
  })
  @IsOptional()
  @IsString()
  format?: string;
}

/**
 * DTO para dados de código de confirmação
 */
class CodeDataDto {
  @ApiProperty({
    description: 'Código de confirmação',
    example: '123456',
  })
  @IsString()
  @Length(4, 20)
  code!: string;

  @ApiPropertyOptional({
    description: 'Método de verificação',
    example: 'SMS',
  })
  @IsOptional()
  @IsString()
  verification_method?: string;
}

/**
 * DTO para adicionar comprovação de entrega
 */
export class AddProofDto {
  @ApiProperty({
    description: 'Tipo de comprovação',
    enum: ProofType,
    example: ProofType.PHOTO,
  })
  @IsEnum(ProofType)
  proof_type!: ProofType;

  @ApiPropertyOptional({
    description: 'Dados da foto',
    type: PhotoDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhotoDataDto)
  photo_data?: PhotoDataDto;

  @ApiPropertyOptional({
    description: 'Dados da assinatura',
    type: SignatureDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SignatureDataDto)
  signature_data?: SignatureDataDto;

  @ApiPropertyOptional({
    description: 'Dados do código de confirmação',
    type: CodeDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CodeDataDto)
  code_data?: CodeDataDto;

  @ApiProperty({
    description: 'Nome de quem recebeu',
    example: 'João Silva',
  })
  @IsString()
  @Length(2, 100)
  recipient_name!: string;

  @ApiPropertyOptional({
    description: 'Documento de quem recebeu (CPF/RG)',
    example: '43380928828',
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  recipient_document?: string;

  @ApiPropertyOptional({
    description: 'Observações',
    example: 'Entregue na portaria',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Data e hora da comprovação',
    example: '2025-12-13T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
