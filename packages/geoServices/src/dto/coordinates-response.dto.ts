import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CoordinatesResponseDto {
  @ApiProperty({
    description: "Latitude",
    example: -23.55052,
  })
  @Expose()
  lat: number;

  @ApiProperty({
    description: "Longitude",
    example: -46.63331,
  })
  @Expose()
  lng: number;

  @ApiProperty({
    description: "Endereço formatado",
    example: "Praça da Sé - Sé, São Paulo - SP, Brasil",
  })
  @Expose()
  formattedAddress: string;

  @ApiProperty({
    description: "ID do lugar (Google Maps)",
    example: "ChIJ0WGkg4XWzpQRmV7W13xT0QQ",
  })
  @Expose()
  placeId: string;
}
