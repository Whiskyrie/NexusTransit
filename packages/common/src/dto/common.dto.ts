import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * DTO base para coordenadas geográficas
 */
export class CoordinatesDto {
  @ApiPropertyOptional({
    description: "Latitude",
    example: -23.561414,
  })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: "Longitude",
    example: -46.65625,
  })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;
}

/**
 * DTO base para endereços
 */
export class AddressDto {
  @ApiPropertyOptional({
    description: "Logradouro",
    example: "Rua Example",
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({
    description: "Número",
    example: "123",
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({
    description: "Complemento",
    example: "Apto 45",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({
    description: "Bairro",
    example: "Centro",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({
    description: "Cidade",
    example: "São Paulo",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: "Estado (UF)",
    example: "SP",
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: "CEP",
    example: "01310-100",
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({
    description: "País",
    example: "Brasil",
    maxLength: 50,
    default: "Brasil",
  })
  @IsOptional()
  @IsString()
  country?: string;
}

/**
 * DTO base para paginação em queries
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: "Número da página",
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Itens por página",
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
