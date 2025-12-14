import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { DeliveryValidationService } from './delivery-validation.service';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Delivery } from '../entities/delivery.entity';
import { DriverStatus } from '../../drivers/enums/driver-status.enum';
import { VehicleStatus } from '../../vehicles/enums/vehicle-status.enum';
import type { BrazilianAddress } from '../interfaces/address.interface';

describe('DeliveryValidationService', () => {
  let service: DeliveryValidationService;
  let _driverRepository: Repository<Driver>;
  let _vehicleRepository: Repository<Vehicle>;
  let _deliveryRepository: Repository<Delivery>;

  const mockDriverRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockVehicleRepository = {
    findOne: jest.fn(),
  };

  const mockDeliveryRepository = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryValidationService,
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepository,
        },
      ],
    }).compile();

    service = module.get<DeliveryValidationService>(DeliveryValidationService);
    _driverRepository = module.get<Repository<Driver>>(getRepositoryToken(Driver));
    _vehicleRepository = module.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));
    _deliveryRepository = module.get<Repository<Delivery>>(getRepositoryToken(Delivery));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDriverAvailability', () => {
    it('deve validar motorista disponível', async () => {
      const mockDriver = {
        id: 'driver-123',
        full_name: 'João Silva',
        status: DriverStatus.AVAILABLE,
        is_active: true,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockDeliveryRepository.count.mockResolvedValue(0);

      const result = await service.validateDriverAvailability(
        'driver-123',
        new Date('2025-12-20T10:00:00Z'),
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar se motorista não existir', async () => {
      mockDriverRepository.findOne.mockResolvedValue(null);

      const result = await service.validateDriverAvailability(
        'driver-999',
        new Date('2025-12-20T10:00:00Z'),
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Motorista não encontrado');
    });

    it('deve falhar se motorista estiver inativo', async () => {
      const mockDriver = {
        id: 'driver-123',
        full_name: 'João Silva',
        status: DriverStatus.UNAVAILABLE,
        is_active: false,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);

      const result = await service.validateDriverAvailability(
        'driver-123',
        new Date('2025-12-20T10:00:00Z'),
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('ativo no sistema');
    });

    it('deve avisar se motorista já tem entregas agendadas', async () => {
      const mockDriver = {
        id: 'driver-123',
        full_name: 'João Silva',
        status: DriverStatus.AVAILABLE,
        is_active: true,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockDeliveryRepository.count.mockResolvedValue(2);

      const result = await service.validateDriverAvailability(
        'driver-123',
        new Date('2025-12-20T10:00:00Z'),
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('2 entrega(s) em andamento');
    });
  });

  describe('validateVehicleCapacity', () => {
    it('deve validar capacidade do veículo', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC-1234',
        status: VehicleStatus.ACTIVE,
        load_capacity: 1000,
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.find.mockResolvedValue([]);

      const result = await service.validateVehicleCapacity('vehicle-123', 500);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar se veículo não existir', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      const result = await service.validateVehicleCapacity('vehicle-999', 500);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Veículo não encontrado');
    });

    it('deve falhar se veículo estiver inativo', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC-1234',
        status: VehicleStatus.INACTIVE,
        load_capacity: 1000,
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.find.mockResolvedValue([]);

      const result = await service.validateVehicleCapacity('vehicle-123', 500);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('disponível');
    });

    it('deve falhar se peso exceder capacidade', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC-1234',
        status: VehicleStatus.ACTIVE,
        load_capacity: 1000,
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.find.mockResolvedValue([]);

      const result = await service.validateVehicleCapacity('vehicle-123', 1500);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('excede a capacidade');
    });

    it('deve avisar se peso está próximo ao limite', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC-1234',
        status: VehicleStatus.ACTIVE,
        load_capacity: 1000,
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.find.mockResolvedValue([]);

      const result = await service.validateVehicleCapacity('vehicle-123', 920);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('próximo do limite');
    });
  });

  describe('validateDriverVehicleAssignment', () => {
    it('deve validar atribuição motorista-veículo', async () => {
      const mockDriver = {
        id: 'driver-123',
        full_name: 'João Silva',
        status: DriverStatus.AVAILABLE,
        license: { id: 'license-123' }, // Mock simplificado da licença
      };

      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC-1234',
        status: VehicleStatus.ACTIVE,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      const result = await service.validateDriverVehicleAssignment('driver-123', 'vehicle-123');

      expect(result.valid).toBe(true);
    });

    it('deve falhar se motorista não tiver CNH válida', async () => {
      const mockDriver = {
        id: 'driver-123',
        full_name: 'João Silva',
        status: DriverStatus.AVAILABLE,
        license: null, // Sem licença cadastrada
      };

      const mockVehicle = {
        id: 'vehicle-123',
        status: VehicleStatus.ACTIVE,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      const result = await service.validateDriverVehicleAssignment('driver-123', 'vehicle-123');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('CNH cadastrada');
    });

    it('deve avisar se motorista já está atribuído a outro veículo', async () => {
      const mockDriver = {
        id: 'driver-123',
        full_name: 'João Silva',
        status: DriverStatus.AVAILABLE,
        license: { id: 'license-123' },
      };

      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC-1234',
        status: VehicleStatus.ACTIVE,
      };

      const mockDeliveryInTransit = {
        id: 'delivery-456',
        driver_id: 'driver-999', // Outro motorista usando o veículo
        vehicle_id: 'vehicle-123',
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.findOne.mockResolvedValue(mockDeliveryInTransit);

      const result = await service.validateDriverVehicleAssignment('driver-123', 'vehicle-123');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('sendo usado por outro motorista');
    });
  });

  describe('validateAddress', () => {
    it('deve validar endereço completo', () => {
      const address: BrazilianAddress = {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        postal_code: '80000-000',
      };

      const result = service.validateAddress(address);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar com campos obrigatórios faltando', () => {
      const address: Partial<BrazilianAddress> = {
        street: 'Rua das Flores',
        city: 'Curitiba',
      };

      const result = service.validateAddress(address as BrazilianAddress);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve falhar com CEP inválido', () => {
      const address: BrazilianAddress = {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'XXX', // 3 caracteres, inválido
        postal_code: 'INVALID',
      };

      const result = service.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('CEP'))).toBe(true);
    });

    it('deve falhar com estado inválido', () => {
      const address: BrazilianAddress = {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'XXX', // 3 caracteres ao invés de 2
        postal_code: '80000-000',
      };

      const result = service.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Estado'))).toBe(true);
    });
  });

  describe('validateDeliveryCreation', () => {
    it('deve validar criação de entrega completa', async () => {
      const deliveryData = {
        weight: 50,
        driverId: 'driver-123',
        vehicleId: 'vehicle-123',
        pickup_address: {
          street: 'Rua A',
          number: '100',
          neighborhood: 'Centro',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80000-000',
        },
        delivery_address: {
          street: 'Rua B',
          number: '200',
          neighborhood: 'Batel',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80420-000',
        },
        scheduled_delivery_at: new Date('2025-12-20T18:00:00Z'),
      };

      const mockDriver = {
        id: 'driver-123',
        status: DriverStatus.AVAILABLE,
        license: { id: 'license-123' },
        is_active: true,
      };

      const mockVehicle = {
        id: 'vehicle-123',
        status: VehicleStatus.ACTIVE,
        load_capacity: 1000,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.count.mockResolvedValue(0);
      mockDeliveryRepository.find.mockResolvedValue([]);
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      const result = await service.validateDeliveryCreation(deliveryData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar com endereços inválidos', async () => {
      const deliveryData = {
        weight: 50,
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
        scheduled_delivery_at: new Date('2025-12-20T18:00:00Z'),
      };

      const result = await service.validateDeliveryCreation(deliveryData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve falhar se data de entrega no passado', async () => {
      const deliveryData = {
        weight: 50,
        pickup_address: {
          street: 'Rua A',
          number: '100',
          neighborhood: 'Centro',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80000-000',
        },
        delivery_address: {
          street: 'Rua B',
          number: '200',
          neighborhood: 'Batel',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80420-000',
        },
        scheduled_delivery_at: new Date('2020-01-01T10:00:00Z'),
      };

      const result = await service.validateDeliveryCreation(deliveryData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('passado'))).toBe(true);
    });

    it('deve validar motorista e veículo quando fornecidos', async () => {
      const deliveryData = {
        weight: 50,
        driverId: 'driver-123',
        vehicleId: 'vehicle-123',
        pickup_address: {
          street: 'Rua A',
          number: '100',
          neighborhood: 'Centro',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80000-000',
        },
        delivery_address: {
          street: 'Rua B',
          number: '200',
          neighborhood: 'Batel',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80420-000',
        },
        scheduled_delivery_at: new Date('2025-12-20T18:00:00Z'),
      };

      const mockDriver = {
        id: 'driver-123',
        status: DriverStatus.UNAVAILABLE,
        license: null,
        is_active: false,
      };

      const mockVehicle = {
        id: 'vehicle-123',
        status: VehicleStatus.INACTIVE,
        load_capacity: 10,
      };

      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockDeliveryRepository.find.mockResolvedValue([]);
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      const result = await service.validateDeliveryCreation(deliveryData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
