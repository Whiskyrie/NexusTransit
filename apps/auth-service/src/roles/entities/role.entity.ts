import { Entity, Column, ManyToMany } from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BaseEntity } from "@nexus/common";
import { RoleType } from "../enums/role-type.enum";

/**
 * Role Entity - Sistema de papéis e permissões
 *
 * Features:
 * - Controle de acesso baseado em papéis (RBAC)
 * - Permissões granulares
 * - Hierarquia de papéis
 * - Timestamps automáticos
 */
@Entity("roles")
export class Role extends BaseEntity {
  @ApiProperty({
    description: "Nome único do papel",
    example: "Gerente de Operações",
  })
  @Column({
    type: "varchar",
    length: 100,
    unique: true,
    comment: "Nome único do papel",
  })
  name!: string;

  @ApiPropertyOptional({
    description: "Descrição do papel",
    example: "Gerencia operações diárias e supervisiona motoristas",
  })
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    comment: "Descrição do papel",
  })
  description?: string;

  @ApiProperty({
    description: "Tipo do papel no sistema",
    enum: RoleType,
    example: RoleType.MANAGER,
  })
  @Column({
    type: "enum",
    enum: RoleType,
    comment: "Tipo do papel no sistema",
  })
  type!: RoleType;

  @ApiProperty({
    description: "Lista de permissões do papel",
    example: ["users:read", "deliveries:read", "deliveries:write"],
    type: [String],
  })
  @Column({
    type: "jsonb",
    default: "[]",
    comment: "Lista de permissões do papel",
  })
  permissions!: string[];

  @ApiProperty({
    description: "Nível hierárquico (0 = maior autoridade)",
    example: 1,
  })
  @Column({
    type: "integer",
    default: 0,
    comment: "Nível hierárquico do papel (0 = maior autoridade)",
  })
  hierarchy_level!: number;

  @ApiProperty({
    description: "Papel está ativo",
    example: true,
  })
  @Column({
    type: "boolean",
    default: true,
    comment: "Papel está ativo",
  })
  is_active!: boolean;

  @ApiPropertyOptional({
    description: "Configurações específicas do papel",
    example: { dashboard_access: true },
  })
  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Configurações específicas do papel",
  })
  settings?: Record<string, unknown>;

  // Relacionamentos

  /**
   * Usuários que possuem este papel
   * Relacionamento inverso de User.roles
   */
  @ManyToMany("User", (user: any) => user.roles)
  users?: any[];

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
    return [RoleType.MANAGER, RoleType.OPERATOR, RoleType.DRIVER].includes(
      this.type
    );
  }

  /**
   * Verifica se pode gerenciar outros usuários
   */
  get can_manage_users(): boolean {
    return this.hasPermission("users:manage") || this.is_admin;
  }
}
