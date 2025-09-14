import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

/**
 * Permission Entity
 * Entidade para gerenciar permissões granulares do sistema
 */
@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'Nome único da permissão (ex: users:create)',
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Recurso ao qual a permissão se aplica',
  })
  resource!: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Ação permitida (create, read, update, delete)',
  })
  action!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Nome de exibição da permissão',
  })
  display_name!: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição da permissão',
  })
  description?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se a permissão está ativa',
  })
  is_active!: boolean;

  /**
   * Verifica se a permissão corresponde ao padrão fornecido
   */
  matches(pattern: string): boolean {
    // Suporte para wildcards (* e ?)
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
    return regex.test(this.name);
  }

  /**
   * Verifica se a permissão é para um recurso específico
   */
  isForResource(resource: string): boolean {
    return this.resource.toLowerCase() === resource.toLowerCase();
  }

  /**
   * Verifica se a permissão é para uma ação específica
   */
  isForAction(action: string): boolean {
    return this.action.toLowerCase() === action.toLowerCase();
  }
}
