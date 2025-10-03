import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { DriverLicense } from './entities/driver-license.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { DriverResponseDto } from './dto/driver-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { normalizeCPF } from './validators/cpf.validator';
import { normalizeCNH } from './validators/cnh.validator';
import { DriverStatus } from './enums/driver-status.enum';
import { CNHCategory } from './enums/cnh-category.enum';

/**
 * Converte data do formato DD-MM-YYYY para YYYY-MM-DD
 * @param dateString Data no formato DD-MM-YYYY
 * @returns Data no formato YYYY-MM-DD ou a string original se não for DD-MM-YYYY
 */
function convertDateFormat(dateString: string): string {
  if (typeof dateString !== 'string') {
    return dateString;
  }

  // Verifica se está no formato DD-MM-YYYY
  const ddmmyyyyPattern = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = ddmmyyyyPattern.exec(dateString);

  if (match?.[1] && match[2] && match[3]) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Se não está no formato DD-MM-YYYY, retorna a string original
  return dateString;
}
@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(DriverLicense)
    private readonly driverLicenseRepository: Repository<DriverLicense>,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    // Validate CPF
    const normalizedCPF = normalizeCPF(createDriverDto.cpf);

    // Check if driver with this CPF already exists
    const existingDriver = await this.driverRepository.findOne({
      where: { cpf: normalizedCPF },
    });

    if (existingDriver) {
      throw new BadRequestException(`Motorista com CPF ${normalizedCPF} já existe`);
    }

    // Check if email already exists
    const existingEmail = await this.driverRepository.findOne({
      where: { email: createDriverDto.email },
    });

    if (existingEmail) {
      throw new BadRequestException(`Email ${createDriverDto.email} já está em uso`);
    }

    // Validate age (minimum 18 years)
    const formattedBirthDate = convertDateFormat(createDriverDto.birth_date);
    const birthDate = new Date(formattedBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new BadRequestException('Motorista deve ter no mínimo 18 anos');
    }

    // Create driver
    const driver = this.driverRepository.create({
      cpf: normalizedCPF,
      full_name: createDriverDto.full_name,
      birth_date: birthDate,
      email: createDriverDto.email,
      phone: createDriverDto.phone,
      status: createDriverDto.status ?? DriverStatus.AVAILABLE,
      is_active: createDriverDto.is_active ?? true,
    });

    const savedDriver = await this.driverRepository.save(driver);

    // Create driver license
    const normalizedCNH = normalizeCNH(createDriverDto.cnh_number);
    const formattedCnhExpirationDate = convertDateFormat(createDriverDto.cnh_expiration_date);
    const cnhExpirationDate = new Date(formattedCnhExpirationDate);

    const driverLicense = this.driverLicenseRepository.create({
      license_number: normalizedCNH,
      category: createDriverDto.cnh_category.toLowerCase() as CNHCategory, // Converter para minúsculo
      issue_date: new Date(), // Default to today
      expiration_date: cnhExpirationDate,
      issuing_authority: 'DENATRAN', // Default
      issuing_state: 'SP', // Default
      is_active: true,
      driver: savedDriver,
    });
    await this.driverLicenseRepository.save(driverLicense);

    return this.mapToResponseDto(savedDriver);
  }

  async findAll(filter: DriverFilterDto): Promise<PaginatedResponseDto<DriverResponseDto>> {
    const { page = 1, limit = 10, ...filters } = filter;
    const skip = (page - 1) * limit;

    const queryBuilder = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.license', 'license')
      .leftJoinAndSelect('driver.documents', 'documents')
      .where('driver.is_active = :isActive', { isActive: true });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('driver.status = :status', { status: filters.status });
    }

    if (filters.name) {
      queryBuilder.andWhere('driver.full_name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.cpf) {
      queryBuilder.andWhere('driver.cpf = :cpf', { cpf: filters.cpf });
    }

    if (filters.email) {
      queryBuilder.andWhere('driver.email = :email', { email: filters.email });
    }

    if (filters.is_active !== undefined) {
      queryBuilder.andWhere('driver.is_active = :isActive', {
        isActive: filters.is_active,
      });
    }

    const [drivers, total] = await queryBuilder
      .orderBy('driver.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const driverDtos = drivers.map(driver => this.mapToResponseDto(driver));

    return PaginatedResponseDto.create(driverDtos, page, limit, total);
  }

  async findOne(id: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['license', 'documents'],
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(driver);
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['license'],
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    // Check for duplicate CPF if being updated
    if (updateDriverDto.cpf && updateDriverDto.cpf !== driver.cpf) {
      const normalizedCPF = normalizeCPF(updateDriverDto.cpf);
      const existingDriver = await this.driverRepository.findOne({
        where: { cpf: normalizedCPF },
      });

      if (existingDriver) {
        throw new BadRequestException(`Motorista com CPF ${normalizedCPF} já existe`);
      }
    }

    // Check for duplicate email if being updated
    if (updateDriverDto.email && updateDriverDto.email !== driver.email) {
      const existingEmail = await this.driverRepository.findOne({
        where: { email: updateDriverDto.email },
      });

      if (existingEmail) {
        throw new BadRequestException(`Email ${updateDriverDto.email} já está em uso`);
      }
    }

    // Update driver fields
    if (updateDriverDto.cpf) {
      driver.cpf = normalizeCPF(updateDriverDto.cpf);
    }
    if (updateDriverDto.full_name) {
      driver.full_name = updateDriverDto.full_name;
    }
    if (updateDriverDto.birth_date) {
      driver.birth_date = new Date(updateDriverDto.birth_date);
    }
    if (updateDriverDto.email) {
      driver.email = updateDriverDto.email;
    }
    if (updateDriverDto.phone) {
      driver.phone = updateDriverDto.phone;
    }
    if (updateDriverDto.status) {
      driver.status = updateDriverDto.status;
    }
    if (updateDriverDto.is_active !== undefined) {
      driver.is_active = updateDriverDto.is_active;
    }

    const updatedDriver = await this.driverRepository.save(driver);

    // Update license if provided
    if (
      updateDriverDto.cnh_number ||
      updateDriverDto.cnh_category ||
      updateDriverDto.cnh_expiration_date
    ) {
      if (driver.license) {
        if (updateDriverDto.cnh_number) {
          driver.license.license_number = normalizeCNH(updateDriverDto.cnh_number);
        }
        if (updateDriverDto.cnh_category) {
          driver.license.category = updateDriverDto.cnh_category;
        }
        if (updateDriverDto.cnh_expiration_date) {
          driver.license.expiration_date = new Date(updateDriverDto.cnh_expiration_date);
        }
        await this.driverLicenseRepository.save(driver.license);
      }
    }

    return this.mapToResponseDto(updatedDriver);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    // Soft delete - mark as inactive
    driver.is_active = false;
    await this.driverRepository.save(driver);
  }

  private mapToResponseDto(driver: Driver): DriverResponseDto {
    return {
      id: driver.id,
      cpf: driver.cpf,
      full_name: driver.full_name,
      birth_date: driver.birth_date?.toISOString().split('T')[0] ?? '',
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      is_active: driver.is_active,
      cnh_number: driver.license?.license_number ?? '',
      cnh_category: driver.license?.category ?? CNHCategory.B,
      cnh_expiration_date: driver.license?.expiration_date?.toISOString().split('T')[0] ?? '',
      created_at: driver.created_at.toISOString(),
      updated_at: driver.updated_at.toISOString(),
    };
  }
}
