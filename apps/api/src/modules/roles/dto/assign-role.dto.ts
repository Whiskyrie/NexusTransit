import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Atribuir Roles a um Usuário
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'Lista de IDs de roles para atribuir ao usuário',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty({ each: true })
  role_ids!: string[];
}

/**
 * DTO para Remover Role de um Usuário
 */
export class RemoveRoleDto {
  @ApiProperty({
    description: 'ID do role para remover do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  role_id!: string;
}

/**
 * DTO para Atualizar Roles de um Usuário
 */
export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Lista completa de IDs de roles do usuário (substitui as existentes)',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty({ each: true })
  role_ids!: string[];
}
