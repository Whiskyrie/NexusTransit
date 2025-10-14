import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverLicense } from '../entities/driver-license.entity';
import { Driver } from '../entities/driver.entity';
import { CNHCategory } from '../enums/cnh-category.enum';
import { normalizeCNH } from '../validators/cnh.validator';
import { convertDateFormat } from '../utils/date.util';
import {
  DEFAULT_CNH_ISSUING_AUTHORITY,
  DEFAULT_CNH_ISSUING_STATE,
} from '../constants/driver.constants';
import { DriverLicenseUpdateData } from '../interfaces/driver-license.interface';

/**
 * Service responsável pela gestão de CNH (Carteira Nacional de Habilitação)
 */
@Injectable()
export class DriverLicenseService {
  private readonly logger = new Logger(DriverLicenseService.name);

  constructor(
    @InjectRepository(DriverLicense)
    private readonly driverLicenseRepository: Repository<DriverLicense>,
  ) {}

  /**
   * Cria uma nova CNH para um motorista
   * @param driver Motorista
   * @param cnhNumber Número da CNH
   * @param category Categoria da CNH
   * @param expirationDate Data de expiração
   * @param issuingAuthority Autoridade emissora (opcional)
   * @param issuingState Estado emissor (opcional)
   * @returns CNH criada
   */
  async createDriverLicense(
    driver: Driver,
    cnhNumber: string,
    category: string,
    expirationDate: string,
    issuingAuthority?: string,
    issuingState?: string,
  ): Promise<DriverLicense> {
    const normalizedCNH = normalizeCNH(cnhNumber);
    const formattedExpirationDate = convertDateFormat(expirationDate);
    const cnhExpirationDate = new Date(formattedExpirationDate);

    // Validar se a data de expiração não está no passado
    if (cnhExpirationDate < new Date()) {
      throw new BadRequestException('Data de expiração da CNH não pode estar no passado');
    }

    const driverLicense = this.driverLicenseRepository.create({
      license_number: normalizedCNH,
      category: category.toLowerCase() as CNHCategory,
      issue_date: new Date(),
      expiration_date: cnhExpirationDate,
      issuing_authority: issuingAuthority ?? DEFAULT_CNH_ISSUING_AUTHORITY,
      issuing_state: issuingState ?? DEFAULT_CNH_ISSUING_STATE,
      is_active: true,
      driver,
    });

    const savedLicense = await this.driverLicenseRepository.save(driverLicense);

    this.logger.log(
      `CNH criada para motorista ${driver.id}: ${normalizedCNH} (${category.toUpperCase()})`,
    );

    return savedLicense;
  }

  /**
   * Atualiza informações da CNH
   * @param licenseId ID da CNH
   * @param updateData Dados para atualização
   * @returns CNH atualizada
   */
  async updateDriverLicense(
    licenseId: string,
    updateData: DriverLicenseUpdateData,
  ): Promise<DriverLicense> {
    const license = await this.driverLicenseRepository.findOne({
      where: { id: licenseId },
    });

    if (!license) {
      throw new BadRequestException('CNH não encontrada');
    }

    if (updateData.license_number) {
      license.license_number = normalizeCNH(updateData.license_number);
    }

    if (updateData.category) {
      license.category = updateData.category.toLowerCase() as CNHCategory;
    }

    if (updateData.expiration_date) {
      const formattedDate = convertDateFormat(updateData.expiration_date);
      const expirationDate = new Date(formattedDate);

      if (expirationDate < new Date()) {
        throw new BadRequestException('Data de expiração da CNH não pode estar no passado');
      }

      license.expiration_date = expirationDate;
    }

    if (updateData.issuing_authority) {
      license.issuing_authority = updateData.issuing_authority;
    }

    if (updateData.issuing_state) {
      license.issuing_state = updateData.issuing_state;
    }

    if (updateData.is_active !== undefined) {
      license.is_active = updateData.is_active;
    }

    const updatedLicense = await this.driverLicenseRepository.save(license);

    this.logger.log(`CNH ${licenseId} atualizada`);

    return updatedLicense;
  }

  /**
   * Verifica se a CNH está próxima do vencimento
   * @param license CNH
   * @param daysWarning Dias antes do vencimento para alertar
   * @returns true se está próxima do vencimento
   */
  isExpirationNear(license: DriverLicense, daysWarning = 30): boolean {
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + daysWarning);

    return license.expiration_date <= warningDate;
  }

  /**
   * Verifica se a CNH está vencida
   * @param license CNH
   * @returns true se está vencida
   */
  isExpired(license: DriverLicense): boolean {
    return license.expiration_date < new Date();
  }

  /**
   * Busca CNH por número
   * @param cnhNumber Número da CNH
   * @returns CNH encontrada ou null
   */
  async findByNumber(cnhNumber: string): Promise<DriverLicense | null> {
    const normalizedCNH = normalizeCNH(cnhNumber);
    return this.driverLicenseRepository.findOne({
      where: { license_number: normalizedCNH },
      relations: ['driver'],
    });
  }
}
