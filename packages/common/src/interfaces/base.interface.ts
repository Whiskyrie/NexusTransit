/**
 * Interface base para todas as entidades do sistema
 */
export interface IBaseEntity {
  id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * Interface para entidades que suportam soft delete
 */
export interface ISoftDeletableEntity extends IBaseEntity {
  deleted_at?: Date;
}

/**
 * Interface para coordenadas geográficas
 */
export interface ICoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Interface para endereços
 */
export interface IAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

/**
 * Interface para timestamps
 */
export interface ITimestamps {
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para auditoria
 */
export interface IAuditable extends ITimestamps {
  created_by?: string;
  updated_by?: string;
}
