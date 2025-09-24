import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { Driver } from './entities/driver.entity';
import { DriverLicense } from './entities/driver-license.entity';
import type { CreateDriverDto } from './dto/create-driver.dto';
import type { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverStatus } from './enums/driver-status.enum';
import { CNHCategory } from './enums/cnh-category.enum';

describe('DriversService', () => {
  let service: DriversService;
  let driverRepository: any;
  let driverLicenseRepository: any;

  const mockDriver = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    cpf: '12345678909',
    full_name: 'João da Silva',
    birth_date: new Date('1990-01-15'),
    email: 'joao@email.com',
    phone: '11999999999',
    status: DriverStatus.AVAILABLE,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    license: null,
    documents: [],
  };

  const mockDriverLicense = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    license_number: '12345678901',
    category: CNHCategory.B,
    issue_date: new Date('2020-01-01'),
    expiration_date: new Date('2030-01-01'),
    issuing_authority: 'DENATRAN',
    issuing_state: 'SP',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    driver: mockDriver,
  };

  const mockCreateDriverDto: CreateDriverDto = {
    cpf: '12345678909',
    full_name: 'João da Silva',
    birth_date: '1990-01-15',
    email: 'joao@email.com',
    phone: '11999999999',
    cnh_number: '12345678901',
    cnh_category: CNHCategory.B,
    cnh_expiration_date: '2030-01-01',
    status: DriverStatus.AVAILABLE,
    is_active: true,
  };

  beforeEach(async () => {
    driverRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockDriver], 1]),
      })),
    };

    driverLicenseRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getRepositoryToken(Driver),
          useValue: driverRepository,
        },
        {
          provide: getRepositoryToken(DriverLicense),
          useValue: driverLicenseRepository,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
  });

  describe('create', () => {
    it('should create a new driver successfully', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValueOnce(null); // CPF not exists
      driverRepository.findOne.mockResolvedValueOnce(null); // Email not exists
      driverRepository.create.mockReturnValue(mockDriver);
      driverRepository.save.mockResolvedValue(mockDriver);
      driverLicenseRepository.create.mockReturnValue(mockDriverLicense);
      driverLicenseRepository.save.mockResolvedValue(mockDriverLicense);

      // Act
      const result = await service.create(mockCreateDriverDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.cpf).toBe('12345678909');
      expect(result.full_name).toBe('João da Silva');
      expect(driverRepository.create).toHaveBeenCalledWith({
        cpf: '12345678909',
        full_name: 'João da Silva',
        birth_date: new Date('1990-01-15'),
        email: 'joao@email.com',
        phone: '11999999999',
        status: DriverStatus.AVAILABLE,
        is_active: true,
      });
    });

    it('should throw BadRequestException when CPF already exists', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValueOnce(mockDriver);

      // Act & Assert
      await expect(service.create(mockCreateDriverDto)).rejects.toThrow(
        new BadRequestException('Motorista com CPF 12345678909 já existe'),
      );
    });

    it('should throw BadRequestException when email already exists', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValueOnce(null); // CPF not exists
      driverRepository.findOne.mockResolvedValueOnce(mockDriver); // Email exists

      // Act & Assert
      await expect(service.create(mockCreateDriverDto)).rejects.toThrow(
        new BadRequestException('Email joao@email.com já está em uso'),
      );
    });

    it('should throw BadRequestException when driver is under 18 years old', async () => {
      // Arrange
      const today = new Date();
      const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      const underageDriver: CreateDriverDto = {
        ...mockCreateDriverDto,
        birth_date: underageDate.toISOString().split('T')[0] as string,
      };
      driverRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(underageDriver)).rejects.toThrow(
        new BadRequestException('Motorista deve ter no mínimo 18 anos'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a driver when found', async () => {
      // Arrange
      const driverWithLicense = { ...mockDriver, license: mockDriverLicense };
      driverRepository.findOne.mockResolvedValue(driverWithLicense);

      // Act
      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(driverRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['license', 'documents'],
      });
    });

    it('should throw NotFoundException when driver not found', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        new NotFoundException(
          'Motorista com ID 123e4567-e89b-12d3-a456-426614174000 não encontrado',
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated drivers', async () => {
      // Act
      const result = await service.findAll({ page: 1, limit: 10 });

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total_pages).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a driver successfully', async () => {
      // Arrange
      const updateDto: UpdateDriverDto = {
        full_name: 'João Silva Updated',
        phone: '11888888888',
      };

      const driverWithLicense = { ...mockDriver, license: mockDriverLicense };
      driverRepository.findOne.mockResolvedValue(driverWithLicense);
      driverRepository.save.mockResolvedValue({ ...driverWithLicense, ...updateDto });

      // Act
      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      // Assert
      expect(result).toBeDefined();
      expect(driverRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when driver not found for update', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValue(null);
      const updateDto: UpdateDriverDto = { full_name: 'Test' };

      // Act & Assert
      await expect(
        service.update('123e4567-e89b-12d3-a456-426614174000', updateDto),
      ).rejects.toThrow(
        new NotFoundException(
          'Motorista com ID 123e4567-e89b-12d3-a456-426614174000 não encontrado',
        ),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a driver successfully', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValue(mockDriver);
      driverRepository.save.mockResolvedValue({ ...mockDriver, is_active: false });

      // Act
      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      // Assert
      expect(driverRepository.save).toHaveBeenCalledWith({
        ...mockDriver,
        is_active: false,
      });
    });

    it('should throw NotFoundException when driver not found for removal', async () => {
      // Arrange
      driverRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        new NotFoundException(
          'Motorista com ID 123e4567-e89b-12d3-a456-426614174000 não encontrado',
        ),
      );
    });
  });
});
