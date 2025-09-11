import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RoleType } from '../enums/role-type.enum';

/**
 * Role Entity - Sistema de papéis e permissões
 *
 * Features:
 * - Controle de acesso baseado em papéis (RBAC)
 * - Permissões granulares
 * - Hierarquia de papéis
 * - Timestamps automáticos
 */
@Entity('roles')
export class Role extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'Nome único do papel',
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Descrição do papel',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    comment: 'Tipo do papel no sistema',
  })
  type!: RoleType;

  @Column({
    type: 'jsonb',
    default: '[]',
    comment: 'Lista de permissões do papel',
  })
  permissions!: string[];

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Nível hierárquico do papel (0 = maior autoridade)',
  })
  hierarchy_level!: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Papel está ativo',
  })
  is_active!: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do papel',
  })
  settings?: Record<string, unknown>;

  // Relacionamentos - será configurado após resolver dependência circular

  // Computed properties

  /**
   * Verifica se o papel tem uma permissão específica
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  /**
   * Verifica se é um papel administrativo
   */
  get is_admin(): boolean {
    return [RoleType.SUPER_ADMIN, RoleType.ADMIN].includes(this.type);
  }

  /**
   * Verifica se é um papel operacional
   */
  get is_operational(): boolean {
    return [RoleType.MANAGER, RoleType.OPERATOR, RoleType.DRIVER].includes(this.type);
  }

  /**
   * Verifica se pode gerenciar outros usuários
   */
  get can_manage_users(): boolean {
    return this.hasPermission('users:manage') || this.is_admin;
  }
}
