import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

/**
    Base Entity with common fields for all entities
**/
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deleted_at?: Date | null;

  /**
   * Hook executed before insert
   * Override in child classes for custom validation
   */
  @BeforeInsert()
  beforeInsert(): void {
    // Pode ser sobrescrito nas entidades filhas
  }

  /**
   * Hook executed before update
   * Override in child classes for custom validation
   */
  @BeforeUpdate()
  beforeUpdate(): void {
    // Pode ser sobrescrito nas entidades filhas
  }

  /**
   * Soft delete the entity
   */
  async softRemove(): Promise<this> {
    this.deleted_at = new Date();
    return this.save();
  }

  /**
   * Restore a soft deleted entity
   */
  async restore(): Promise<this> {
    this.deleted_at = null;
    return this.save();
  }

  /**
   * Check if entity is soft deleted
   */
  get isDeleted(): boolean {
    return this.deleted_at !== null && this.deleted_at !== undefined;
  }
}
