import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * DTO para geração de nota fiscal
 */
export class InvoiceDto {
  @ApiProperty({
    description: 'Número da nota fiscal',
    example: 'NF-2024-00001',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  invoice_number!: string;

  @ApiProperty({
    description: 'Data de emissão da nota fiscal',
    example: '2024-12-26',
  })
  @IsDateString()
  issue_date!: string;

  @ApiPropertyOptional({
    description: 'Data de vencimento da nota fiscal',
    example: '2024-12-30',
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({
    description: 'Valor total da nota fiscal',
    example: 1250.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total_amount!: number;

  @ApiPropertyOptional({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Observações sobre a nota fiscal',
    example: 'Nota fiscal referente à ordem de serviço OS-2024-00001',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'URL do PDF da nota fiscal',
    example: 'https://storage.example.com/invoices/NF-2024-00001.pdf',
  })
  @IsOptional()
  @IsString()
  pdf_url?: string;

  @ApiPropertyOptional({
    description: 'Chave de acesso da nota fiscal (44 dígitos)',
    example: '12345678901234567890123456789012345678901234',
    maxLength: 44,
  })
  @IsOptional()
  @IsString()
  @MaxLength(44)
  access_key?: string;
}
