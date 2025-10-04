import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataRequestEntity } from './entities/data-request.entity';
import { CreateDataRequestDto, UpdateDataRequestDto } from './dto/lgpdDto';
import { DataRequestStatus, DataRequestType } from './enums/lgpdEnums';

@Injectable()
export class DataRequestService {
  constructor(
    @InjectRepository(DataRequestEntity)
    private readonly dataRequestRepository: Repository<DataRequestEntity>,
  ) {}

  /**
   * Cria uma nova solicitação de dados
   */
  async createDataRequest(
    userId: string,
    createDataRequestDto: CreateDataRequestDto,
  ): Promise<DataRequestEntity> {
    // Verifica se já existe solicitação pendente do mesmo tipo
    const existingRequest = await this.dataRequestRepository.findOne({
      where: {
        userId,
        requestType: createDataRequestDto.requestType,
        status: DataRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        `Já existe uma solicitação ${createDataRequestDto.requestType} pendente para este usuário`,
      );
    }

    // Calcula data limite conforme LGPD (15 dias úteis)
    const dueDate = this.calculateDueDate();

    const dataRequest = this.dataRequestRepository.create({
      userId,
      ...createDataRequestDto,
      dueDate,
      status: DataRequestStatus.PENDING,
    });

    return this.dataRequestRepository.save(dataRequest);
  }

  /**
   * Atualiza uma solicitação de dados (apenas para administradores)
   */
  async updateDataRequest(
    requestId: string,
    updateDataRequestDto: UpdateDataRequestDto,
    adminId: string,
  ): Promise<DataRequestEntity> {
    const dataRequest = await this.dataRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!dataRequest) {
      throw new NotFoundException('Solicitação de dados não encontrada');
    }

    // Atualiza campos permitidos
    Object.assign(dataRequest, updateDataRequestDto);

    if (updateDataRequestDto.status === DataRequestStatus.PROCESSING) {
      dataRequest.startProcessing(adminId);
    }

    return this.dataRequestRepository.save(dataRequest);
  }

  /**
   * Marca solicitação como concluída
   */
  async completeDataRequest(
    requestId: string,
    filePath?: string,
    fileHash?: string,
    fileSize?: number,
  ): Promise<DataRequestEntity> {
    const dataRequest = await this.dataRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!dataRequest) {
      throw new NotFoundException('Solicitação de dados não encontrada');
    }

    dataRequest.complete(filePath, fileHash, fileSize);
    return this.dataRequestRepository.save(dataRequest);
  }

  /**
   * Marca solicitação como falha
   */
  async failDataRequest(requestId: string, errorMessage: string): Promise<DataRequestEntity> {
    const dataRequest = await this.dataRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!dataRequest) {
      throw new NotFoundException('Solicitação de dados não encontrada');
    }

    dataRequest.fail(errorMessage);
    return this.dataRequestRepository.save(dataRequest);
  }

  /**
   * Obtém solicitações de um usuário
   */
  async getUserDataRequests(userId: string): Promise<DataRequestEntity[]> {
    return this.dataRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtém uma solicitação específica
   */
  async getDataRequest(requestId: string): Promise<DataRequestEntity> {
    const dataRequest = await this.dataRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!dataRequest) {
      throw new NotFoundException('Solicitação de dados não encontrada');
    }

    return dataRequest;
  }

  /**
   * Lista todas as solicitações (para administradores)
   */
  async getAllDataRequests(
    status?: DataRequestStatus,
    requestType?: DataRequestType,
    page = 1,
    limit = 10,
  ): Promise<{
    requests: DataRequestEntity[];
    total: number;
    totalPages: number;
  }> {
    const queryBuilder = this.dataRequestRepository.createQueryBuilder('request');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (requestType) {
      queryBuilder.andWhere('request.requestType = :requestType', { requestType });
    }

    queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      requests,
      total,
      totalPages,
    };
  }

  /**
   * Obtém solicitações próximas do vencimento
   */
  async getRequestsNearDueDate(days = 3): Promise<DataRequestEntity[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.dataRequestRepository
      .createQueryBuilder('request')
      .where('request.status IN (:...statuses)', {
        statuses: [DataRequestStatus.PENDING, DataRequestStatus.PROCESSING],
      })
      .andWhere('request.dueDate <= :futureDate', { futureDate })
      .andWhere('request.dueDate > :now', { now: new Date() })
      .orderBy('request.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Marca solicitações vencidas como expiradas
   */
  async expireOverdueRequests(): Promise<number> {
    const overdueRequests = await this.dataRequestRepository
      .createQueryBuilder('request')
      .where('request.status IN (:...statuses)', {
        statuses: [DataRequestStatus.PENDING, DataRequestStatus.PROCESSING],
      })
      .andWhere('request.dueDate < :now', { now: new Date() })
      .getMany();

    for (const request of overdueRequests) {
      request.expire();
    }

    if (overdueRequests.length > 0) {
      await this.dataRequestRepository.save(overdueRequests);
    }

    return overdueRequests.length;
  }

  /**
   * Cancela uma solicitação (pelo usuário)
   */
  async cancelDataRequest(requestId: string, userId: string): Promise<DataRequestEntity> {
    const dataRequest = await this.dataRequestRepository.findOne({
      where: {
        id: requestId,
        userId,
        status: DataRequestStatus.PENDING,
      },
    });

    if (!dataRequest) {
      throw new NotFoundException('Solicitação não encontrada ou não pode ser cancelada');
    }

    dataRequest.cancel();
    return this.dataRequestRepository.save(dataRequest);
  }

  /**
   * Obtém estatísticas de solicitações
   */
  async getDataRequestStatistics(): Promise<{
    totalRequests: number;
    requestsByStatus: Record<DataRequestStatus, number>;
    requestsByType: Record<DataRequestType, number>;
    averageProcessingTime: number;
    overdueRequests: number;
  }> {
    const totalRequests = await this.dataRequestRepository.count();

    // Estatísticas por status
    const statusQuery = await this.dataRequestRepository
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status')
      .getRawMany<{ status: DataRequestStatus; count: number }>();

    const requestsByStatus = {} as Record<DataRequestStatus, number>;
    for (const result of statusQuery) {
      requestsByStatus[result.status] = parseInt(String(result.count));
    }

    // Estatísticas por tipo
    const typeQuery = await this.dataRequestRepository
      .createQueryBuilder('request')
      .select('request.requestType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.requestType')
      .getRawMany<{ type: DataRequestType; count: number }>();

    const requestsByType = {} as Record<DataRequestType, number>;
    for (const result of typeQuery) {
      requestsByType[result.type] = parseInt(String(result.count));
    }

    // Tempo médio de processamento (em horas)
    const avgProcessingQuery = await this.dataRequestRepository
      .createQueryBuilder('request')
      .select(
        'AVG(EXTRACT(EPOCH FROM (request.completedAt - request.processingStartedAt)) / 3600)',
        'avgHours',
      )
      .where('request.status = :status', { status: DataRequestStatus.COMPLETED })
      .andWhere('request.processingStartedAt IS NOT NULL')
      .andWhere('request.completedAt IS NOT NULL')
      .getRawOne<{ avgHours: string }>();

    const averageProcessingTime = parseFloat(avgProcessingQuery?.avgHours ?? '0');

    // Solicitações vencidas
    const overdueRequests = await this.dataRequestRepository
      .createQueryBuilder('request')
      .where('request.status IN (:...statuses)', {
        statuses: [DataRequestStatus.PENDING, DataRequestStatus.PROCESSING],
      })
      .andWhere('request.dueDate < :now', { now: new Date() })
      .getCount();

    return {
      totalRequests,
      requestsByStatus,
      requestsByType,
      averageProcessingTime,
      overdueRequests,
    };
  }

  /**
   * Calcula data limite para processamento (15 dias úteis conforme LGPD)
   */
  private calculateDueDate(): Date {
    const dueDate = new Date();
    let businessDays = 0;

    while (businessDays < 15) {
      dueDate.setDate(dueDate.getDate() + 1);

      // Pula fins de semana (sábado = 6, domingo = 0)
      if (dueDate.getDay() !== 0 && dueDate.getDay() !== 6) {
        businessDays++;
      }
    }

    return dueDate;
  }
}
