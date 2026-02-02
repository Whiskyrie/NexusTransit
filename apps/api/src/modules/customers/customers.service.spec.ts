import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CustomerPreferences } from './entities/customer-preferences.entity';
import { CepFallbackService } from '@nexus/geo-services';
import { GeocodingService } from './services/geocoding.service';
import { DataSource } from 'typeorm';

describe('CustomersService', () => {
  let service: CustomersService;
  let module: TestingModule;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCepFallbackService = {
    getAddressByZipCode: jest.fn(),
  };

  const mockGeocodingService = {
    geocodeAddress: jest.fn(),
  };

  const mockDataSource = {
    manager: {
      transaction: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CustomerAddress),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CustomerContact),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CustomerPreferences),
          useValue: mockRepository,
        },
        {
          provide: CepFallbackService,
          useValue: mockCepFallbackService,
        },
        {
          provide: GeocodingService,
          useValue: mockGeocodingService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
