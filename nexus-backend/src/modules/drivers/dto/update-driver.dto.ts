import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';

/**
 * Update Driver DTO
 * DTO para atualização de motoristas
 */
export class UpdateDriverDto extends PartialType(CreateDriverDto) {}
