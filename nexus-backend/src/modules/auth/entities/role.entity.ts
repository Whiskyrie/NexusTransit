import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Role as RoleEnum } from '../enums/role.enum';
import { User } from '../../users/entities/user.entity';

/**
 * Role Entity
 * Entidade para gerenciar roles do sistema RBAC
 */
@Entity('roles')
export class Role extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'Nome único do role',
  })
  name!: RoleEnum;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Nome de exibição do role',
  })
  display_name!: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição do role',
  })
  description?: string;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Nível hierárquico (0 = mais alto)',
  })
  hierarchy_level!: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Permissões específicas do role',
  })
  permissions?: string[];

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se o role está ativo',
  })
  is_active!: boolean;

  // Relacionamentos
  @ManyToMany(() => User, user => user.roles)
  users!: User[];

  /**
   * Verifica se o role tem uma permissão específica
   */
  hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) ?? false;
  }

  /**
   * Verifica se o role tem uma das permissões especificadas
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verifica se o role tem todas as permissões especificadas
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
}
