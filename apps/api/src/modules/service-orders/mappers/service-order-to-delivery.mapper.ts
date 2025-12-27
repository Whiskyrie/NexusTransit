import { Injectable, Logger } from '@nestjs/common';
import { ServiceOrder } from '../entities/service-order.entity';
import { GenerateDeliveryFromServiceOrderDto } from '../dto/generate-delivery-from-service-order.dto';
import { CreateDeliveryDto } from '../../deliveries/dto/create-delivery.dto';
import { DeliveryPriority } from '../../deliveries/enums/delivery-priority.enum';

/**
 * Mapper para conversão de ServiceOrder para CreateDeliveryDto
 *
 * Responsável por mapear dados de uma ordem de serviço para
 * o formato necessário para criação de uma entrega
 */
@Injectable()
export class ServiceOrderToDeliveryMapper {
  private readonly logger = new Logger(ServiceOrderToDeliveryMapper.name);

  /**
   * Mapeia uma ordem de serviço e dados adicionais para DTO de criação de entrega
   *
   * @param serviceOrder - Ordem de serviço origem
   * @param deliveryData - Dados adicionais da entrega
   * @returns DTO pronto para criação de entrega
   */
  mapToCreateDeliveryDto(
    serviceOrder: ServiceOrder,
    deliveryData: GenerateDeliveryFromServiceOrderDto,
  ): CreateDeliveryDto {
    this.logger.debug(`Mapeando OS ${serviceOrder.order_number} para delivery DTO`);

    const createDeliveryDto: CreateDeliveryDto = {
      // Dados obrigatórios
      customer_id: deliveryData.customer_id,
      weight: deliveryData.weight,
      declared_value: deliveryData.declared_value,

      // Descrição - usa da OS se não fornecida
      description: deliveryData.description || this.generateDescription(serviceOrder),

      // Prioridade - mapeia da OS se não fornecida
      priority: deliveryData.priority ?? this.mapPriority(serviceOrder),

      // Endereço de coleta - usa dados da OS como fallback
      pickup_address: {
        street:
          deliveryData.pickup_address?.street ??
          this.extractStreetFromLocation(serviceOrder.service_location) ??
          'Endereço da OS',
        number: deliveryData.pickup_address?.number ?? 'S/N',
        complement: deliveryData.pickup_address?.complement,
        neighborhood: deliveryData.pickup_address?.neighborhood ?? '',
        city: deliveryData.pickup_address?.city ?? 'Cidade',
        state: deliveryData.pickup_address?.state ?? 'UF',
        postal_code: deliveryData.pickup_address?.postal_code ?? '00000-000',
        country: deliveryData.pickup_address?.country ?? 'Brasil',
        latitude: deliveryData.pickup_address?.latitude,
        longitude: deliveryData.pickup_address?.longitude,
      },

      // Endereço de entrega
      delivery_address: {
        street: deliveryData.delivery_address.street,
        number: deliveryData.delivery_address.number,
        complement: deliveryData.delivery_address.complement,
        neighborhood: deliveryData.delivery_address.neighborhood,
        city: deliveryData.delivery_address.city,
        state: deliveryData.delivery_address.state,
        postal_code: deliveryData.delivery_address.postal_code,
        country: deliveryData.delivery_address.country ?? 'Brasil',
        latitude: deliveryData.delivery_address.latitude,
        longitude: deliveryData.delivery_address.longitude,
      },

      // Contatos
      sender_contact: {
        name: deliveryData.pickup_contact.name,
        phone: deliveryData.pickup_contact.phone,
        email: deliveryData.pickup_contact.email,
      },
      recipient_contact: {
        name: deliveryData.delivery_contact.name,
        phone: deliveryData.delivery_contact.phone,
        email: deliveryData.delivery_contact.email,
      },

      // Datas de agendamento
      scheduled_pickup_at:
        deliveryData.scheduled_pickup_at ??
        (serviceOrder.scheduled_date
          ? typeof serviceOrder.scheduled_date === 'string'
            ? serviceOrder.scheduled_date
            : serviceOrder.scheduled_date.toISOString()
          : new Date().toISOString()),
      scheduled_delivery_at: deliveryData.scheduled_delivery_at,
    };

    this.logger.debug(`Delivery DTO criado para OS ${serviceOrder.order_number}`);

    return createDeliveryDto;
  }

  /**
   * Gera descrição automática baseada na ordem de serviço
   */
  private generateDescription(serviceOrder: ServiceOrder): string {
    return `Entrega gerada automaticamente da OS ${serviceOrder.order_number} - ${serviceOrder.title}`;
  }

  /**
   * Mapeia prioridade da ordem de serviço para prioridade de entrega
   */
  private mapPriority(serviceOrder: ServiceOrder): DeliveryPriority {
    // Lógica de mapeamento baseada em características da OS
    const urgentTypes = ['EMERGENCIA', 'URGENTE'];
    const normalTypes = ['INSTALACAO', 'MANUTENCAO'];

    if (urgentTypes.some(type => serviceOrder.service_type?.includes(type))) {
      return DeliveryPriority.HIGH;
    }

    if (normalTypes.some(type => serviceOrder.service_type?.includes(type))) {
      return DeliveryPriority.NORMAL;
    }

    // Considera custo estimado
    if (serviceOrder.estimated_cost && serviceOrder.estimated_cost > 1000) {
      return DeliveryPriority.HIGH;
    }

    return DeliveryPriority.NORMAL;
  }

  /**
   * Extrai rua do campo service_location
   * Tenta parsear formatos comuns como "Rua ABC, 123"
   */
  private extractStreetFromLocation(location?: string): string | null {
    if (!location) {
      return null;
    }

    // Remove número e complemento
    const regex = /^([^,\d]+)/;
    const streetMatch = regex.exec(location);
    return streetMatch ? streetMatch[1].trim() : location;
  }

  /**
   * Valida se todos os campos obrigatórios estão preenchidos
   */
  validateDeliveryData(deliveryData: GenerateDeliveryFromServiceOrderDto): void {
    const missingFields: string[] = [];

    if (!deliveryData.customer_id) {
      missingFields.push('customer_id');
    }
    if (!deliveryData.weight) {
      missingFields.push('weight');
    }
    if (!deliveryData.declared_value) {
      missingFields.push('declared_value');
    }
    if (!deliveryData.delivery_address) {
      missingFields.push('delivery_address');
    }
    if (!deliveryData.delivery_contact) {
      missingFields.push('delivery_contact');
    }
    if (!deliveryData.pickup_contact) {
      missingFields.push('pickup_contact');
    }

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }
  }
}
