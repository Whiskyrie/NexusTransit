import type { Driver } from '../entities/driver.entity';
import type { DriverLicense } from '../entities/driver-license.entity';
import type { DriverDocument } from '../entities/driver-document.entity';

/**
 * Interface base para entidade de motorista
 */
export interface DriverEntityInterface {
  id: string;
  cpf: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para motorista com relações carregadas
 */
export interface DriverWithRelations extends Omit<Driver, 'license' | 'documents'> {
  license?: DriverLicense;
  documents?: DriverDocument[];
  activeDocuments?: DriverDocument[];
  deliveriesCount?: number;
  lastActivityAt?: Date;
}

/**
 * Interface para resposta de motorista com estatísticas
 */
export interface DriverResponse {
  driver: Driver;
  statistics?: {
    totalDeliveries: number;
    completedDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageDeliveryTime?: number;
  };
  license?: DriverLicense;
  documentsStatus?: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
  };
}
