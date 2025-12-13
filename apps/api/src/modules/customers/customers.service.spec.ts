import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CustomerPreferences } from './entities/customer-preferences.entity';
import { ViaCepService } from './services/viacep.service';
import { GeocodingService } from './services/geocoding.service';
import { DataSource } from 'typeorm';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockViaCepService = {
    getAddressByCep: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
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
          provide: ViaCepService,
          useValue: mockViaCepService,
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
