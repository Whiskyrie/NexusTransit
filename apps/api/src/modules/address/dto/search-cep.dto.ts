import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCEP } from '@nexus/common';

/**
 * DTO para busca de CEP
 */
export class SearchCepDto {
  @ApiProperty({
    description: 'CEP para busca (formato: 00000-000 ou 00000000)',
    example: '01001-000',
  })
  @IsNotEmpty()
  @IsCEP()
  cep!: string;
}
