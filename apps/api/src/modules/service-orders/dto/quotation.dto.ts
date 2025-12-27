import { ApiProperty } from '@nestjs/swagger';
import { PricingResult } from '../services/service-order-pricing.service';

/**
 * DTO para resposta de cotação
 */
export class QuotationDto {
  @ApiProperty({
    description: 'Preço base do serviço',
    example: 50.0,
  })
  base_price!: number;

  @ApiProperty({
    description: 'Taxa de peso',
    example: 25.0,
  })
  weight_fee!: number;

  @ApiProperty({
    description: 'Taxa de volume',
    example: 30.0,
  })
  volume_fee!: number;

  @ApiProperty({
    description: 'Taxa de distância',
    example: 45.0,
  })
  distance_fee!: number;

  @ApiProperty({
    description: 'Taxa de prioridade',
    example: 37.5,
  })
  priority_fee!: number;

  @ApiProperty({
    description: 'Taxa de seguro',
    example: 20.0,
  })
  insurance_fee!: number;

  @ApiProperty({
    description: 'Subtotal antes do desconto',
    example: 207.5,
  })
  subtotal!: number;

  @ApiProperty({
    description: 'Valor do desconto',
    example: 31.13,
  })
  discount!: number;

  @ApiProperty({
    description: 'Percentual de desconto aplicado',
    example: 15,
  })
  discount_percentage!: number;

  @ApiProperty({
    description: 'Valor total da cotação',
    example: 196.37,
  })
  total!: number;

  @ApiProperty({
    description: 'Detalhamento dos custos',
    type: [Object],
    example: [
      { description: 'Taxa base', amount: 50.0 },
      { description: 'Taxa de peso', amount: 25.0 },
      { description: 'Taxa de volume', amount: 30.0 },
      { description: 'Taxa de distância', amount: 45.0 },
      { description: 'Taxa de prioridade', amount: 37.5 },
      { description: 'Taxa de seguro', amount: 20.0 },
      { description: 'Desconto', amount: -31.13 },
    ],
  })
  breakdown!: { description: string; amount: number }[];

  @ApiProperty({
    description: 'Tempo estimado de entrega em horas',
    example: 24,
  })
  estimated_delivery_hours!: number;

  @ApiProperty({
    description: 'Veículo sugerido para a entrega',
    example: 'Van Média',
    required: false,
  })
  suggested_vehicle?: string;

  @ApiProperty({
    description: 'SLA em horas',
    example: 24,
  })
  sla_hours!: number;

  @ApiProperty({
    description: 'Data de validade da cotação',
    example: '2025-01-02T00:00:00Z',
  })
  valid_until!: Date;

  /**
   * Cria um QuotationDto a partir de um PricingResult
   */
  static fromPricingResult(
    result: PricingResult & {
      estimated_delivery_hours: number;
      suggested_vehicle?: string;
      sla_hours: number;
      valid_until: Date;
    },
  ): QuotationDto {
    const dto = new QuotationDto();
    Object.assign(dto, result);
    return dto;
  }
}
