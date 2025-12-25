import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para retomar uma ordem de serviço pausada
 */
export class ResumeServiceOrderDto {
  @ApiPropertyOptional({
    description: 'ID do usuário que retomou a ordem',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
