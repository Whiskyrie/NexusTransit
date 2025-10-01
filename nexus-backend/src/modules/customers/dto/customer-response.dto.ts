import type { Customer } from '../entities/customer.entity';
import type { CustomerAddress } from '../entities/customer-address.entity';
import type { CustomerContact } from '../entities/customer-contact.entity';
import type { CustomerPreferences } from '../entities/customer-preferences.entity';

export class CustomerResponseDto {
  id: string;
  taxId: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  category: string;
  metadata?: Record<string, unknown>;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  preferences?: CustomerPreferences[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      taxId: customer.taxId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      type: customer.type,
      status: customer.status,
      category: customer.category,
      metadata: customer.metadata,
      addresses: customer.addresses,
      contacts: customer.contacts,
      preferences: customer.preferences,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
