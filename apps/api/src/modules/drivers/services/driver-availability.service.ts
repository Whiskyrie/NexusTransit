import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import { DriverAvailability } from '../entities/driver-availability.entity';
import { Driver } from '../entities/driver.entity';
import { CreateDriverAvailabilityDto } from '../dto/create-driver-availability.dto';
import { UpdateDriverAvailabilityDto } from '../dto/update-driver-availability.dto';
import { DriverAvailabilityFilterDto } from '../dto/driver-availability-filter.dto';
import { DriverAvailabilityResponseDto } from '../dto/driver-availability-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { AvailabilityType } from '../enums/availability-type.enum';

/**
 * Service responsável pela gestão de disponibilidade/ausência de motoristas
 *
 * Funcionalidades:
 * - CRUD completo de registros de disponibilidade
 * - Validação de períodos sobrepostos
 * - Verificação de disponibilidade em datas específicas
 * - Aprovação de ausências
 * - Relatórios de disponibilidade
 */
@Injectable()
export class DriverAvailabilityService {
  private readonly logger = new Logger(DriverAvailabilityService.name);

  constructor(
    @InjectRepository(DriverAvailability)
    private readonly availabilityRepository: Repository<DriverAvailability>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  /**
   * Cria um novo registro de disponibilidade/ausência
   */
  async create(createDto: CreateDriverAvailabilityDto): Promise<DriverAvailabilityResponseDto> {
    // 1. Validar se o motorista existe
    const driver = await this.driverRepository.findOne({
      where: { id: createDto.driver_id },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${createDto.driver_id} não encontrado`);
    }

    // 2. Validar período
    this.validatePeriod(createDto.start_date, createDto.end_date);

    // 3. Verificar conflitos com períodos existentes
    await this.checkOverlappingPeriods(
      createDto.driver_id,
      createDto.start_date,
      createDto.end_date,
    );

    // 4. Criar entidade
    const availability = this.availabilityRepository.create({
      ...createDto,
      start_date: new Date(createDto.start_date),
      end_date: new Date(createDto.end_date),
    });

    // 5. Salvar
    const saved = await this.availabilityRepository.save(availability);

    this.logger.log(
      `Disponibilidade criada: ID ${saved.id}, Driver ${saved.driver_id}, ` +
        `Tipo: ${saved.availability_type}`,
    );

    // 6. Retornar DTO de resposta
    return this.mapToResponseDto(saved);
  }

  /**
   * Lista registros de disponibilidade com filtros e paginação
   */
  async findAll(
    filterDto: DriverAvailabilityFilterDto,
  ): Promise<PaginatedResponseDto<DriverAvailabilityResponseDto>> {
    const {
      page = 1,
      limit = 10,
      driver_id,
      availability_type,
      start_date,
      end_date,
      is_active,
      is_approved,
      active_on_date,
    } = filterDto;

    // 1. Construir where clause
    const where: FindOptionsWhere<DriverAvailability> = {};

    if (driver_id) {
      where.driver_id = driver_id;
    }

    if (availability_type) {
      where.availability_type = availability_type;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (is_approved !== undefined) {
      where.is_approved = is_approved;
    }

    // Filtrar por período específico
    if (start_date && end_date) {
      where.start_date = MoreThanOrEqual(new Date(start_date));
      where.end_date = LessThanOrEqual(new Date(end_date));
    } else if (start_date) {
      where.start_date = MoreThanOrEqual(new Date(start_date));
    } else if (end_date) {
      where.end_date = LessThanOrEqual(new Date(end_date));
    }

    // Filtrar registros ativos em uma data específica
    if (active_on_date) {
      const targetDate = new Date(active_on_date);
      where.start_date = LessThanOrEqual(targetDate);
      where.end_date = MoreThanOrEqual(targetDate);
    }

    // 2. Executar query com paginação
    const [availabilities, total] = await this.availabilityRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { start_date: 'DESC', created_at: 'DESC' },
    });

    // 3. Calcular metadados
    const totalPages = Math.ceil(total / limit);

    // 4. Retornar resposta paginada
    return {
      data: availabilities.map(a => this.mapToResponseDto(a)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  /**
   * Busca um registro específico por ID
   */
  async findOne(id: string): Promise<DriverAvailabilityResponseDto> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['driver'],
    });

    if (!availability) {
      throw new NotFoundException(`Registro de disponibilidade com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(availability);
  }

  /**
   * Atualiza um registro de disponibilidade
   */
  async update(
    id: string,
    updateDto: UpdateDriverAvailabilityDto,
  ): Promise<DriverAvailabilityResponseDto> {
    const availability = await this.findAvailabilityOrFail(id);

    // Validar novo período se as datas forem alteradas
    if (updateDto.start_date || updateDto.end_date) {
      const newStartDate = updateDto.start_date
        ? new Date(updateDto.start_date)
        : availability.start_date;
      const newEndDate = updateDto.end_date ? new Date(updateDto.end_date) : availability.end_date;

      this.validatePeriod(newStartDate.toISOString(), newEndDate.toISOString());

      // Verificar conflitos (excluindo o próprio registro)
      await this.checkOverlappingPeriods(
        availability.driver_id,
        newStartDate.toISOString(),
        newEndDate.toISOString(),
        id,
      );
    }

    // Aplicar atualizações
    Object.assign(availability, {
      ...updateDto,
      ...(updateDto.start_date && { start_date: new Date(updateDto.start_date) }),
      ...(updateDto.end_date && { end_date: new Date(updateDto.end_date) }),
    });

    const updated = await this.availabilityRepository.save(availability);

    this.logger.log(`Disponibilidade atualizada: ID ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove um registro de disponibilidade (soft delete)
   */
  async remove(id: string): Promise<void> {
    const availability = await this.findAvailabilityOrFail(id);

    await this.availabilityRepository.softRemove(availability);

    this.logger.log(`Disponibilidade removida: ID ${id}`);
  }

  /**
   * Aprova um registro de disponibilidade
   */
  async approve(id: string, approvedBy: string): Promise<DriverAvailabilityResponseDto> {
    const availability = await this.findAvailabilityOrFail(id);

    if (availability.is_approved) {
      throw new BadRequestException('Este registro já foi aprovado');
    }

    availability.is_approved = true;
    availability.approved_by = approvedBy;
    availability.approved_at = new Date();

    const updated = await this.availabilityRepository.save(availability);

    this.logger.log(`Disponibilidade aprovada: ID ${id} por ${approvedBy}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Revoga a aprovação de um registro
   */
  async revokeApproval(id: string): Promise<DriverAvailabilityResponseDto> {
    const availability = await this.findAvailabilityOrFail(id);

    if (!availability.is_approved) {
      throw new BadRequestException('Este registro não está aprovado');
    }

    availability.is_approved = false;
    availability.approved_by = undefined;
    availability.approved_at = undefined;

    const updated = await this.availabilityRepository.save(availability);

    this.logger.log(`Aprovação revogada: ID ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Verifica se um motorista está disponível em uma data específica
   */
  async isDriverAvailable(driverId: string, date: Date | string): Promise<boolean> {
    const targetDate = new Date(date);

    const unavailabilities = await this.availabilityRepository.count({
      where: {
        driver_id: driverId,
        is_active: true,
        start_date: LessThanOrEqual(targetDate),
        end_date: MoreThanOrEqual(targetDate),
        availability_type: AvailabilityType.AVAILABLE,
      },
    });

    return unavailabilities === 0;
  }

  /**
   * Obtém todas as indisponibilidades ativas de um motorista
   */
  async getActiveUnavailabilities(driverId: string): Promise<DriverAvailability[]> {
    const now = new Date();

    return this.availabilityRepository.find({
      where: {
        driver_id: driverId,
        is_active: true,
        end_date: MoreThanOrEqual(now),
      },
      order: { start_date: 'ASC' },
    });
  }

  // ===================================
  // Métodos Privados
  // ===================================

  /**
   * Valida se o período é válido
   */
  private validatePeriod(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('Data de início deve ser anterior à data de término');
    }

    // Validar se o período não é muito longo (mais de 1 ano)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      throw new BadRequestException(
        `Período muito longo: ${diffDays} dias. Máximo permitido: 365 dias`,
      );
    }
  }

  /**
   * Verifica se há períodos sobrepostos
   */
  private async checkOverlappingPeriods(
    driverId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<void> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const queryBuilder = this.availabilityRepository
      .createQueryBuilder('availability')
      .where('availability.driver_id = :driverId', { driverId })
      .andWhere('availability.is_active = :isActive', { isActive: true })
      .andWhere('(availability.start_date <= :end AND availability.end_date >= :start)', {
        start,
        end,
      });

    if (excludeId) {
      queryBuilder.andWhere('availability.id != :excludeId', { excludeId });
    }

    const overlapping = await queryBuilder.getOne();

    if (overlapping) {
      throw new ConflictException(
        `Já existe um registro de disponibilidade para este motorista no período: ` +
          `${overlapping.start_date.toLocaleDateString('pt-BR')} até ` +
          `${overlapping.end_date.toLocaleDateString('pt-BR')}`,
      );
    }
  }

  /**
   * Busca entidade ou lança erro
   */
  private async findAvailabilityOrFail(id: string): Promise<DriverAvailability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException(`Registro de disponibilidade com ID ${id} não encontrado`);
    }

    return availability;
  }

  /**
   * Mapeia entidade para DTO de resposta
   */
  private mapToResponseDto(availability: DriverAvailability): DriverAvailabilityResponseDto {
    const dto = new DriverAvailabilityResponseDto();
    Object.assign(dto, availability);

    // Calcular campos adicionais
    dto.duration_days = availability.getDurationInDays();

    // Determinar status do período
    if (availability.isCurrentlyActive()) {
      dto.period_status = 'current';
    } else if (availability.isFuture()) {
      dto.period_status = 'future';
    } else if (availability.isPast()) {
      dto.period_status = 'past';
    }

    return dto;
  }
}
