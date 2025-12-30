import { IsArray, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Atribuir Permissões a um Role
 */
export class AssignPermissionDto {
  @ApiProperty({
    description: 'Lista de permissões para adicionar ao role',
    example: ['users:read', 'users:write', 'roles:read'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions!: string[];
}

/**
 * DTO para Remover Permissões de um Role
 */
export class RemovePermissionDto {
  @ApiProperty({
    description: 'Lista de permissões para remover do role',
    example: ['users:delete'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions!: string[];
}

/**
 * DTO para Atualizar Permissões de um Role
 */
export class UpdatePermissionsDto {
  @ApiProperty({
    description: 'Lista completa de permissões do role (substitui as existentes)',
    example: ['users:read', 'users:write', 'roles:read', 'roles:write'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions!: string[];
}
