import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Update User DTO
 * Mantém fidelidade total com o monólito
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
