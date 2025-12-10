import { ApiProperty } from "@nestjs/swagger";

export class PaginationMetaDto {
  @ApiProperty({
    description: "Página atual",
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: "Itens por página",
    example: 10,
  })
  limit!: number;

  @ApiProperty({
    description: "Total de itens",
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: "Total de páginas",
    example: 10,
  })
  total_pages!: number;

  @ApiProperty({
    description: "Possui página anterior",
    example: false,
  })
  has_previous!: boolean;

  @ApiProperty({
    description: "Possui próxima página",
    example: true,
  })
  has_next!: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: "Lista de itens",
    isArray: true,
  })
  data!: T[];

  @ApiProperty({
    description: "Metadados da paginação",
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;

  /**
   * Factory method to create a paginated response
   */
  static create<T>(data: T[], page: number, limit: number, total: number): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(total / limit);
    const response = new PaginatedResponseDto<T>();
    response.data = data;
    response.meta = {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_previous: page > 1,
      has_next: page < totalPages,
    };
    return response;
  }
}
