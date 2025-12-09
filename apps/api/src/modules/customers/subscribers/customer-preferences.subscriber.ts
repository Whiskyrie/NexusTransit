import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { CustomerPreferences } from '../entities/customer-preferences.entity';

@EventSubscriber()
export class CustomerPreferencesSubscriber
  implements EntitySubscriberInterface<CustomerPreferences>
{
  private readonly logger = new Logger(CustomerPreferencesSubscriber.name);

  listenTo(): typeof CustomerPreferences {
    return CustomerPreferences;
  }

  beforeInsert(event: InsertEvent<CustomerPreferences>): void {
    const entity = event.entity;
    this.logger.debug(`Before insert preferences for customer: ${entity.customerId}`);
  }

  afterInsert(event: InsertEvent<CustomerPreferences>): void {
    const entity = event.entity;
    this.logger.log(`Preferences created: ${entity.id} for customer: ${entity.customerId}`);
  }

  beforeUpdate(event: UpdateEvent<CustomerPreferences>): void {
    const entity = event.entity as CustomerPreferences;
    if (entity) {
      this.logger.debug(`Before update preferences: ${entity.id}`);
    }
  }

  afterUpdate(event: UpdateEvent<CustomerPreferences>): void {
    const entity = event.entity as CustomerPreferences;
    if (entity) {
      this.logger.log(`Preferences updated: ${entity.id}`);
    }
  }

  beforeSoftRemove(event: SoftRemoveEvent<CustomerPreferences>): void {
    const entity = event.entity;
    if (entity) {
      this.logger.debug(`Before soft remove preferences: ${entity.id}`);
    }
  }

  afterSoftRemove(event: SoftRemoveEvent<CustomerPreferences>): void {
    const entity = event.entity;
    if (entity) {
      this.logger.log(`Preferences soft removed: ${entity.id}`);
    }
  }
}
