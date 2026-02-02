import { Test, type TestingModule } from '@nestjs/testing';
import { ServiceOrdersService } from './service-orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceOrder } from './entities/service-order.entity';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { ServiceOrderWorkflowService } from './services/service-order-workflow.service';
import { ServiceOrderValidationService } from './services/service-order-validation.service';
import { ServiceOrderPricingService } from './services/service-order-pricing.service';
import { GoogleMapsService } from '@nexus/geo-services';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from './enums/service_order-status';
import { DeliveryPriority } from '../deliveries/enums/delivery-priority.enum';
import { ServiceOrderToDeliveryMapper } from './mappers/service-order-to-delivery.mapper';

interface AddressDto {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

interface ContactDto {
  name: string;
  phone: string;
}

interface GenerateDeliveryFromServiceOrderDto {
  customer_id: string;
  priority?: DeliveryPriority;
  description: string;
  pickup_address: AddressDto;
  delivery_address: AddressDto;
  pickup_contact: ContactDto;
  delivery_contact: ContactDto;
  scheduled_pickup_at: string;
  scheduled_delivery_at: string;
  weight: number;
  declared_value: number;
}

interface CreateServiceOrderDto {
  customer_id: string;
  service_type: string;
  title: string;
  description: string;
  service_location: string;
  scheduled_date: string;
  estimated_cost: number;
}

interface MockServiceOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  service_location?: string;
  metadata?: Record<string, unknown>;
  customer_id?: string;
  service_type?: string;
  title?: string;
  description?: string;
  scheduled_date?: string;
  estimated_cost?: number;
}

interface MockDelivery {
  id: string;
  tracking_code: string;
}

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;
  let module: TestingModule;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    count: jest.fn(),
  };

  const mockDeliveriesService = {
    create: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockWorkflowService = {
    canTransition: jest.fn(),
    getWorkflowInfo: jest.fn(),
  };

  const mockDeliveryMapper = {
    mapToCreateDeliveryDto: jest.fn(),
    validateDeliveryData: jest.fn(),
  };

  const mockValidationService = {
    validateCreate: jest.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
    validateUpdate: jest.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
    canAutoApprove: jest.fn().mockResolvedValue(false),
    validateCustomerCredit: jest.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
  };

  const mockPricingService = {
    calculatePrice: jest.fn().mockReturnValue(100),
    generateQuotation: jest.fn().mockReturnValue({
      base_price: 100,
      total: 100,
      breakdown: {},
      valid_until: new Date(),
    }),
    calculateSLA: jest.fn().mockReturnValue(24),
  };

  const mockGoogleMapsService = {
    getDistanceMatrix: jest.fn().mockResolvedValue({
      rows: [{ elements: [{ distance: { value: 10000 } }] }],
    }),
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
    getRoutes: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ServiceOrdersService,
        {
          provide: getRepositoryToken(ServiceOrder),
          useValue: mockRepository,
        },
        {
          provide: DeliveriesService,
          useValue: mockDeliveriesService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ServiceOrderWorkflowService,
          useValue: mockWorkflowService,
        },
        {
          provide: ServiceOrderValidationService,
          useValue: mockValidationService,
        },
        {
          provide: ServiceOrderPricingService,
          useValue: mockPricingService,
        },
        {
          provide: ServiceOrderToDeliveryMapper,
          useValue: mockDeliveryMapper,
        },
        {
          provide: GoogleMapsService,
          useValue: mockGoogleMapsService,
        },
      ],
    }).compile();

    service = module.get<ServiceOrdersService>(ServiceOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma ordem de serviço com sucesso', async () => {
      const createDto: CreateServiceOrderDto = {
        customer_id: 'customer-uuid',
        service_type: 'TRANSPORTE',
        title: 'Teste',
        description: 'Descrição teste',
        service_location: 'Endereço de teste',
        scheduled_date: new Date().toISOString(),
        estimated_cost: 100,
      };

      const mockServiceOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        ...createDto,
        status: OrderStatus.PENDING,
      };

      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockReturnValue(mockServiceOrder);
      mockRepository.save.mockResolvedValue(mockServiceOrder);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'service-order.created',
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma ordem de serviço', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-uuid');

      expect(result).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-uuid' },
        relations: ['vehicle', 'driver', 'customer', 'pickup_address', 'delivery_address'],
      });
    });

    it('deve lançar NotFoundException quando ordem não existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('pauseOrder', () => {
    it('deve pausar uma ordem em execução', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.IN_PROGRESS,
        metadata: {},
      };

      const pausedOrder: MockServiceOrder = {
        ...mockOrder,
        status: OrderStatus.ON_HOLD,
        metadata: {
          pause_reason: 'Teste',
          paused_at: expect.any(String),
        },
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue(pausedOrder);

      const result = await service.pauseOrder('order-uuid', 'Teste', 'user-uuid');

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'service-order.status-changed',
        expect.any(Object),
      );
    });

    it('deve lançar erro se ordem não está em execução', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.pauseOrder('order-uuid', 'Teste')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resumeOrder', () => {
    it('deve retomar uma ordem pausada', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.ON_HOLD,
        metadata: {},
      };

      const resumedOrder: MockServiceOrder = {
        ...mockOrder,
        status: OrderStatus.IN_PROGRESS,
        metadata: {
          resumed_at: expect.any(String),
        },
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue(resumedOrder);

      const result = await service.resumeOrder('order-uuid', 'user-uuid');

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'service-order.status-changed',
        expect.any(Object),
      );
    });

    it('deve lançar erro se ordem não está pausada', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.IN_PROGRESS,
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.resumeOrder('order-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateDeliveryFromServiceOrder', () => {
    it('deve gerar entrega a partir da ordem de serviço', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.PENDING,
        service_location: 'Endereço de coleta',
        metadata: {},
      };

      const mockDelivery: MockDelivery = {
        id: 'delivery-uuid',
        tracking_code: 'TRACK-001',
      };

      const deliveryData: GenerateDeliveryFromServiceOrderDto = {
        customer_id: 'customer-uuid',
        priority: DeliveryPriority.NORMAL,
        description: 'Teste',
        pickup_address: {
          street: 'Rua Coleta',
          number: '100',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'UF',
          postal_code: '00000-000',
        },
        delivery_address: {
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'UF',
          postal_code: '00000-000',
        },
        pickup_contact: {
          name: 'Contato Coleta',
          phone: '11999999999',
        },
        delivery_contact: {
          name: 'Contato Entrega',
          phone: '11888888888',
        },
        scheduled_pickup_at: new Date().toISOString(),
        scheduled_delivery_at: new Date().toISOString(),
        weight: 10.5,
        declared_value: 150.0,
      };

      const mockCreateDeliveryDto = {
        customer_id: 'customer-uuid',
        description: 'Test delivery',
        weight: 10.5,
        declared_value: 150.0,
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);
      mockDeliveryMapper.validateDeliveryData.mockReturnValue(undefined);
      mockDeliveryMapper.mapToCreateDeliveryDto.mockReturnValue(mockCreateDeliveryDto);
      mockDeliveriesService.create.mockResolvedValue(mockDelivery);
      mockRepository.save.mockResolvedValue({
        ...mockOrder,
        metadata: { generated_delivery_id: 'delivery-uuid' },
      });

      const result = await service.generateDeliveryFromServiceOrder('order-uuid', deliveryData);

      expect(result).toBeDefined();
      expect(mockDeliveriesService.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('delivery.generated', expect.any(Object));
    });

    it('deve lançar erro se já existe entrega gerada', async () => {
      const mockOrder: MockServiceOrder = {
        id: 'order-uuid',
        order_number: 'OS-2025-00001',
        status: OrderStatus.PENDING,
        metadata: { generated_delivery_id: 'existing-delivery' },
      };

      const emptyDeliveryData: GenerateDeliveryFromServiceOrderDto = {
        customer_id: '',
        priority: DeliveryPriority.LOW,
        description: '',
        pickup_address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postal_code: '',
        },
        delivery_address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postal_code: '',
        },
        pickup_contact: {
          name: '',
          phone: '',
        },
        delivery_contact: {
          name: '',
          phone: '',
        },
        scheduled_pickup_at: new Date().toISOString(),
        scheduled_delivery_at: new Date().toISOString(),
        weight: 0,
        declared_value: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.generateDeliveryFromServiceOrder('order-uuid', emptyDeliveryData),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
