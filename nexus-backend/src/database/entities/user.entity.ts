import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum UserType {
  ADMIN = 'admin',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
  OPERATOR = 'operator',
  MANAGER = 'manager',
}

/**
 * User Entity - Sistema de usuários do Nexus Transit
 *
 * Features:
 * - Autenticação e autorização
 * - Perfis diferenciados (admin, driver, customer, etc.)
 * - Timestamps automáticos
 * - Soft delete
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Email único do usuário',
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Hash da senha do usuário',
  })
  password_hash!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Primeiro nome do usuário',
  })
  first_name!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Sobrenome do usuário',
  })
  last_name!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone do usuário',
  })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.CUSTOMER,
    comment: 'Tipo de usuário no sistema',
  })
  user_type!: UserType;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    comment: 'Status atual do usuário',
  })
  status!: UserStatus;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Último login do usuário',
  })
  last_login_at?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações personalizadas do usuário',
  })
  preferences?: Record<string, unknown>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Email foi verificado',
  })
  email_verified!: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data de verificação do email',
  })
  email_verified_at?: Date;

  // Relacionamentos serão adicionados após criação da entidade Role

  // Computed properties

  /**
   * Nome completo do usuário
   */
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  /**
   * Verifica se o usuário é ativo
   */
  get is_active(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica se o usuário pode fazer login
   */
  get can_login(): boolean {
    return this.is_active && this.email_verified;
  }
}
