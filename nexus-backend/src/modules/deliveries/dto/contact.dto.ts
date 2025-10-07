import { IsString, IsNotEmpty, IsOptional, IsEmail, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name!: string;

  @ApiProperty({
    description: 'Telefone',
    example: '11987654321',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  phone!: string;

  @ApiPropertyOptional({
    description: 'Email',
    example: 'joao@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Documento (CPF/CNPJ)',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  document?: string;
}
