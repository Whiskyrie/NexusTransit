import { ApiProperty } from '@nestjs/swagger';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryStatus, DeliveryStatusDescriptions } from '../enums/delivery-status.enum';
import { DeliveryPriority, DeliveryPriorityDescriptions } from '../enums/delivery-priority.enum';

export class DeliveryResponseDto {
  @ApiProperty({
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Código de rastreamento',
    example: 'NEX123456789BR',
  })
  tracking_code!: string;

  @ApiProperty({
    description: 'Status da entrega',
    example: 'IN_TRANSIT',
    enum: DeliveryStatus,
  })
  status!: DeliveryStatus;

  @ApiProperty({
    description: 'Descrição do status',
    example: 'Em trânsito',
  })
  status_description!: string;

  @ApiProperty({
    description: 'Prioridade da entrega',
    example: 'NORMAL',
    enum: DeliveryPriority,
  })
  priority!: DeliveryPriority;

  @ApiProperty({
    description: 'Descrição da prioridade',
    example: 'Prioridade normal',
  })
  priority_description!: string;

  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  customer_id!: string;

  @ApiProperty({
    description: 'Dados do cliente',
    required: false,
  })
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    taxId: string;
  };

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  driver_id?: string | undefined;

  @ApiProperty({
    description: 'Dados do motorista',
    required: false,
  })
  driver?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    cpf: string;
  };

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  vehicle_id?: string | undefined;

  @ApiProperty({
    description: 'Dados do veículo',
    required: false,
  })
  vehicle?: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
    year: number;
    vehicle_type: string;
  };

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Caixa com eletrônicos',
  })
  description!: string;

  @ApiProperty({
    description: 'Peso em kg',
    example: 5.5,
  })
  weight!: number;

  @ApiProperty({
    description: 'Valor declarado',
    example: 1500,
  })
  declared_value!: number;

  @ApiProperty({
    description: 'Dimensões da embalagem',
    required: false,
  })
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit?: string;
  };

  @ApiProperty({
    description: 'Informações do produto',
    required: false,
  })
  product_info?: {
    category?: string;
    fragility?: string;
    perishable?: boolean;
    stackable?: boolean;
    special_handling?: string[];
  };

  @ApiProperty({
    description: 'Endereço de coleta',
  })
  pickup_address!: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };

  @ApiProperty({
    description: 'Endereço de entrega',
  })
  delivery_address!: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };

  @ApiProperty({
    description: 'Contato do remetente',
    required: false,
  })
  sender_contact?: {
    name: string;
    phone: string;
    email?: string;
  };

  @ApiProperty({
    description: 'Contato do destinatário',
    required: false,
  })
  recipient_contact?: {
    name: string;
    phone: string;
    email?: string;
    document?: string;
  };

  @ApiProperty({
    description: 'Data/hora agendada para coleta',
    example: '2024-01-15T09:00:00Z',
  })
  scheduled_pickup_at!: Date;

  @ApiProperty({
    description: 'Data/hora agendada para entrega',
    example: '2024-01-15T15:00:00Z',
  })
  scheduled_delivery_at!: Date;

  @ApiProperty({
    description: 'Data/hora real da coleta',
    example: '2024-01-15T09:30:00Z',
    required: false,
  })
  actual_pickup_at?: Date;

  @ApiProperty({
    description: 'Data/hora real da entrega',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  actual_delivery_at?: Date;

  @ApiProperty({
    description: 'Distância estimada em km',
    example: 25.5,
    required: false,
  })
  estimated_distance?: number;

  @ApiProperty({
    description: 'Duração estimada em minutos',
    example: 45,
    required: false,
  })
  estimated_duration?: number;

  @ApiProperty({
    description: 'Taxa de entrega',
    example: 25,
    required: false,
  })
  delivery_fee?: number;

  @ApiProperty({
    description: 'Custo total da entrega',
    example: 35,
    required: false,
  })
  total_cost?: number;

  @ApiProperty({
    description: 'Informações de pagamento',
    required: false,
  })
  payment_info?: {
    method?: string;
    status?: string;
    amount?: number;
    paid_at?: Date;
    transaction_id?: string;
  };

  @ApiProperty({
    description: 'Instruções para coleta',
    example: 'Retirar na recepção',
    required: false,
  })
  pickup_instructions?: string;

  @ApiProperty({
    description: 'Instruções para entrega',
    example: 'Entregar com João da portaria',
    required: false,
  })
  delivery_instructions?: string;

  @ApiProperty({
    description: 'Observações gerais',
    example: 'Produto frágil',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Configurações especiais',
    required: false,
  })
  settings?: {
    requires_signature?: boolean;
    requires_photo?: boolean;
    requires_id?: boolean;
    allowed_attempt_count?: number;
    time_windows?: {
      start: string;
      end: string;
    }[];
    restricted_hours?: {
      start: string;
      end: string;
    }[];
  };

  @ApiProperty({
    description: 'Dados de rastreamento em tempo real',
    required: false,
  })
  tracking_data?: {
    last_latitude?: number;
    last_longitude?: number;
    last_update?: Date;
    speed?: number;
    heading?: number;
    accuracy?: number;
  };

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T08:00:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00Z',
  })
  updated_at!: Date;

  @ApiProperty({
    description: 'Número de tentativas de entrega',
    example: 2,
    required: false,
  })
  attempt_count?: number;

  @ApiProperty({
    description: 'Número de comprovantes',
    example: 1,
    required: false,
  })
  proof_count?: number;

  @ApiProperty({
    description: 'Indica se está atrasada',
    example: false,
    required: false,
  })
  is_overdue?: boolean;

  @ApiProperty({
    description: 'Indica se está ativa',
    example: true,
    required: false,
  })
  is_active?: boolean;

  @ApiProperty({
    description: 'Tempo restante para entrega (horas)',
    example: 4.5,
    required: false,
  })
  hours_remaining?: number;

  @ApiProperty({
    description: 'Progresso da entrega (percentual)',
    example: 75,
    required: false,
  })
  progress_percentage?: number;

  // Método estático para mapear da entidade
  static fromEntity(delivery: Delivery): DeliveryResponseDto {
    const response = new DeliveryResponseDto();

    // Dados básicos
    response.id = delivery.id;
    response.tracking_code = delivery.tracking_code;
    response.status = delivery.status;
    response.status_description = DeliveryStatusDescriptions[delivery.status];
    response.priority = delivery.priority;
    response.priority_description = DeliveryPriorityDescriptions[delivery.priority];

    // Relacionamentos (IDs)
    response.customer_id = delivery.customer_id;
    response.driver_id = delivery.driver_id;
    response.vehicle_id = delivery.vehicle_id;

    // Relacionamentos (dados completos - se disponíveis)
    if (delivery.customer) {
      response.customer = {
        id: delivery.customer.id,
        name: delivery.customer.name || '',
        email: delivery.customer.email || '',
        phone: delivery.customer.phone || '',
        taxId: delivery.customer.taxId || '',
      };
    }

    if (delivery.driver) {
      response.driver = {
        id: delivery.driver.id,
        full_name: delivery.driver.full_name || '',
        email: delivery.driver.email || '',
        phone: delivery.driver.phone || '',
        cpf: delivery.driver.cpf || '',
      };
    }

    if (delivery.vehicle) {
      response.vehicle = {
        id: delivery.vehicle.id,
        license_plate: delivery.vehicle.license_plate || '',
        brand: delivery.vehicle.brand || '',
        model: delivery.vehicle.model || '',
        year: delivery.vehicle.year || 0,
        vehicle_type: delivery.vehicle.vehicle_type || '',
      };
    }

    // Dados da entrega
    response.description = delivery.description;
    response.weight = delivery.weight;
    response.declared_value = delivery.declared_value;
    if (delivery.dimensions !== undefined) {
      response.dimensions = delivery.dimensions;
    }
    if (delivery.product_info !== undefined) {
      response.product_info = delivery.product_info;
    }
    response.pickup_address = delivery.pickup_address;
    response.delivery_address = delivery.delivery_address;
    if (delivery.sender_contact !== undefined) {
      response.sender_contact = delivery.sender_contact;
    }
    if (delivery.recipient_contact !== undefined) {
      response.recipient_contact = delivery.recipient_contact;
    }

    // Datas
    response.scheduled_pickup_at = delivery.scheduled_pickup_at;
    response.scheduled_delivery_at = delivery.scheduled_delivery_at;
    if (delivery.actual_pickup_at !== undefined) {
      response.actual_pickup_at = delivery.actual_pickup_at;
    }
    if (delivery.actual_delivery_at !== undefined) {
      response.actual_delivery_at = delivery.actual_delivery_at;
    }

    // Cálculos
    if (delivery.estimated_distance !== undefined) {
      response.estimated_distance = delivery.estimated_distance;
    }
    if (delivery.estimated_duration !== undefined) {
      response.estimated_duration = delivery.estimated_duration;
    }
    if (delivery.delivery_fee !== undefined) {
      response.delivery_fee = delivery.delivery_fee;
    }
    if (delivery.total_cost !== undefined) {
      response.total_cost = delivery.total_cost;
    }
    if (delivery.payment_info !== undefined) {
      response.payment_info = delivery.payment_info;
    }

    // Instruções e observações
    if (delivery.pickup_instructions !== undefined) {
      response.pickup_instructions = delivery.pickup_instructions;
    }
    if (delivery.delivery_instructions !== undefined) {
      response.delivery_instructions = delivery.delivery_instructions;
    }
    if (delivery.notes !== undefined) {
      response.notes = delivery.notes;
    }
    if (delivery.settings !== undefined) {
      response.settings = delivery.settings;
    }
    if (delivery.tracking_data !== undefined) {
      response.tracking_data = delivery.tracking_data;
    }

    // Datas de auditoria
    response.created_at = delivery.created_at;
    response.updated_at = delivery.updated_at;

    // Contadores
    response.attempt_count = delivery.attempts?.length || 0;
    response.proof_count = delivery.proofs?.length || 0;

    // Status calculados
    const now = new Date();
    response.is_overdue =
      delivery.scheduled_delivery_at < now && !['DELIVERED', 'CANCELLED'].includes(delivery.status);
    response.is_active = !['DELIVERED', 'CANCELLED'].includes(delivery.status);

    // Cálculos de progresso e tempo
    if (response.is_active && delivery.scheduled_delivery_at) {
      const totalMs = delivery.scheduled_delivery_at.getTime() - delivery.created_at.getTime();
      const elapsedMs = now.getTime() - delivery.created_at.getTime();
      response.progress_percentage = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

      const remainingMs = delivery.scheduled_delivery_at.getTime() - now.getTime();
      response.hours_remaining = Math.max(0, remainingMs / (1000 * 60 * 60));
    }

    return response;
  }
}
