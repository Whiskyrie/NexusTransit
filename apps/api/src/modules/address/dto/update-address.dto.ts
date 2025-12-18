import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

/**
 * DTO para atualização de endereço
 * Todos os campos são opcionais
 */
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
