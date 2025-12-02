/**
 * Interface base para todas as entidades do sistema
 */
export interface BaseEntity {
  id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * Interface para entidades que suportam soft delete
 */
export interface SoftDeletableEntity extends BaseEntity {
  deleted_at?: Date;
}

/**
 * Interface para entidades pagináveis
 */
export interface PaginatedEntity {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Interface para entidades com filtros comuns
 */
export interface FilterableEntity {
  search?: string;
  created_at?: {
    from?: string;
    to?: string;
  };
  updated_at?: {
    from?: string;
    to?: string;
  };
}
