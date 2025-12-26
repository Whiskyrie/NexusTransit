import {
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * DTO para atualização de pagamento
 */
export class UpdatePaymentDto {
  @ApiPropertyOptional({
    description: 'Status do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Valor pago',
    example: 1250.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_paid?: number;

  @ApiPropertyOptional({
    description: 'Data do pagamento',
    example: '2024-12-26',
  })
  @IsOptional()
  @IsDateString()
  payment_date?: string;

  @ApiPropertyOptional({
    description: 'Número da transação',
    example: 'TXN-2024-12-26-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transaction_id?: string;

  @ApiPropertyOptional({
    description: 'Observações sobre o pagamento',
    example: 'Pagamento realizado via cartão de crédito',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Comprovante de pagamento (URL)',
    example: 'https://storage.example.com/receipts/TXN-2024-12-26-001.pdf',
  })
  @IsOptional()
  @IsString()
  receipt_url?: string;
}
