import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class AddressResponseDto {
  @ApiProperty({
    description: "CEP do endereço",
    example: "01001000",
  })
  @Expose()
  zipCode: string;

  @ApiProperty({
    description: "Nome da rua/logradouro",
    example: "Praça da Sé",
  })
  @Expose()
  street: string;

  @ApiPropertyOptional({
    description: "Complemento do endereço",
    example: "Lado ímpar",
  })
  @Expose()
  complement?: string;

  @ApiProperty({
    description: "Bairro",
    example: "Sé",
  })
  @Expose()
  neighborhood: string;

  @ApiProperty({
    description: "Cidade",
    example: "São Paulo",
  })
  @Expose()
  city: string;

  @ApiProperty({
    description: "Estado (UF)",
    example: "SP",
  })
  @Expose()
  state: string;

  @ApiPropertyOptional({
    description: "Código IBGE do município",
    example: "3550308",
  })
  @Expose()
  ibgeCode?: string;

  @ApiPropertyOptional({
    description: "DDD da região",
    example: "11",
  })
  @Expose()
  ddd?: string;

  @ApiProperty({
    description: "Endereço formatado",
    example: "Praça da Sé, Lado ímpar - Sé, São Paulo - SP, 01001-000",
  })
  @Expose()
  get formattedAddress(): string {
    let address = `${this.street}, ${this.neighborhood}, ${this.city} - ${this.state}, ${this.zipCode}`;
    if (this.complement) {
      address = `${this.street}, ${this.complement} - ${address}`;
    }
    return address;
  }
}
