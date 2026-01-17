import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { Webhook, WebhookEvent } from '../entities/webhook.entity';
import { WebhookLog, WebhookLogStatus } from '../entities/webhook-log.entity';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookFilterDto,
  WebhookResponseDto,
  WebhookLogFilterDto,
  WebhookLogResponseDto,
} from '../dto';
import { PaginatedResponseDto } from '@nexus/common';

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
}

/**
 * Service para gerenciamento de webhooks
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepository: Repository<WebhookLog>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Cria um novo webhook
   */
  async create(createDto: CreateWebhookDto): Promise<WebhookResponseDto> {
    const webhook = this.webhookRepository.create({
      ...createDto,
      consecutive_failures: 0,
    });

    const saved = await this.webhookRepository.save(webhook);
    this.logger.log(`Webhook criado: ${saved.id} - ${saved.name}`);

    return this.mapToResponseDto(saved);
  }

  /**
   * Lista webhooks com filtros e paginacao
   */
  async findAll(filterDto: WebhookFilterDto): Promise<PaginatedResponseDto<WebhookResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      event,
      created_after,
      created_before,
    } = filterDto;

    const queryBuilder = this.webhookRepository.createQueryBuilder('webhook');

    if (search) {
      queryBuilder.andWhere('(webhook.name ILIKE :search OR webhook.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('webhook.is_active = :is_active', { is_active });
    }

    if (event) {
      queryBuilder.andWhere(':event = ANY(webhook.events)', { event });
    }

    if (created_after) {
      queryBuilder.andWhere('webhook.created_at >= :created_after', {
        created_after: new Date(created_after),
      });
    }

    if (created_before) {
      queryBuilder.andWhere('webhook.created_at <= :created_before', {
        created_before: new Date(created_before),
      });
    }

    const [webhooks, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('webhook.created_at', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: webhooks.map(w => this.mapToResponseDto(w)),
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
   * Busca webhook por ID
   */
  async findOne(id: string): Promise<WebhookResponseDto> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new NotFoundException(`Webhook com ID ${id} nao encontrado`);
    }

    return this.mapToResponseDto(webhook);
  }

  /**
   * Atualiza webhook
   */
  async update(id: string, updateDto: UpdateWebhookDto): Promise<WebhookResponseDto> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new NotFoundException(`Webhook com ID ${id} nao encontrado`);
    }

    Object.assign(webhook, updateDto);
    const updated = await this.webhookRepository.save(webhook);

    this.logger.log(`Webhook atualizado: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove webhook
   */
  async remove(id: string): Promise<void> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new NotFoundException(`Webhook com ID ${id} nao encontrado`);
    }

    await this.webhookRepository.softRemove(webhook);
    this.logger.log(`Webhook removido: ${id}`);
  }

  /**
   * Dispara webhook para um evento
   */
  async trigger(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.find({
        where: {
          is_active: true,
        },
      });

      const matchingWebhooks = webhooks.filter(w => w.events.includes(event));

      this.logger.log(`Disparando ${matchingWebhooks.length} webhooks para evento: ${event}`);

      await Promise.allSettled(
        matchingWebhooks.map(webhook => this.executeWebhook(webhook, event, payload)),
      );
    } catch (error) {
      // Ignora silenciosamente se a tabela webhooks não existir
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relação "webhooks" não existe')) {
        this.logger.debug('Tabela webhooks não existe, pulando disparo de webhooks');
        return;
      }
      // Re-lança outros erros
      throw error;
    }
  }

  /**
   * Executa webhook com retry logic
   */
  private async executeWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, unknown>,
    attemptNumber = 1,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'NexusTransit-Webhook/1.0',
        'X-Webhook-Event': event,
      };

      if (webhook.custom_headers) {
        Object.assign(headers, webhook.custom_headers);
      }

      if (webhook.secret) {
        const signature = this.generateSignature(webhookPayload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await firstValueFrom(
        this.httpService.post(webhook.url, webhookPayload, {
          headers,
          timeout: webhook.timeout_ms,
        }),
      );

      const responseTime = Date.now() - startTime;

      await this.logWebhookExecution({
        webhook,
        event,
        status: WebhookLogStatus.SUCCESS,
        attemptNumber,
        requestPayload: webhookPayload,
        requestHeaders: headers,
        httpStatus: response.status,
        responseBody: JSON.stringify(response.data),
        responseHeaders: response.headers as Record<string, string>,
        responseTimeMs: responseTime,
      });

      webhook.last_triggered_at = new Date();
      webhook.consecutive_failures = 0;
      await this.webhookRepository.save(webhook);

      this.logger.log(`Webhook executado com sucesso: ${webhook.id} - ${event}`);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const axiosError = this.extractAxiosError(error);

      await this.logWebhookExecution({
        webhook,
        event,
        status:
          attemptNumber < webhook.max_retries
            ? WebhookLogStatus.PENDING_RETRY
            : WebhookLogStatus.FAILED,
        attemptNumber,
        requestPayload: {
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        },
        httpStatus: axiosError.response?.status,
        responseBody: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : undefined,
        responseTimeMs: responseTime,
        errorMessage,
      });

      webhook.consecutive_failures += 1;
      await this.webhookRepository.save(webhook);

      if (attemptNumber < webhook.max_retries) {
        const retryDelay = this.calculateRetryDelay(attemptNumber);
        this.logger.warn(
          `Webhook falhou (tentativa ${attemptNumber}/${webhook.max_retries}). Retry em ${retryDelay}ms - ${webhook.id}`,
        );

        setTimeout(() => {
          void this.executeWebhook(webhook, event, payload, attemptNumber + 1);
        }, retryDelay);
      } else {
        this.logger.error(
          `Webhook falhou apos ${webhook.max_retries} tentativas: ${webhook.id} - ${errorMessage}`,
        );
      }
    }
  }

  /**
   * Lista logs de webhook
   */
  async findLogs(
    filterDto: WebhookLogFilterDto,
  ): Promise<PaginatedResponseDto<WebhookLogResponseDto>> {
    const {
      page = 1,
      limit = 10,
      webhook_id,
      status,
      triggered_after,
      triggered_before,
    } = filterDto;

    const queryBuilder = this.webhookLogRepository.createQueryBuilder('log');

    if (webhook_id) {
      queryBuilder.andWhere('log.webhook_id = :webhook_id', { webhook_id });
    }

    if (status) {
      queryBuilder.andWhere('log.status = :status', { status });
    }

    if (triggered_after) {
      queryBuilder.andWhere('log.triggered_at >= :triggered_after', {
        triggered_after: new Date(triggered_after),
      });
    }

    if (triggered_before) {
      queryBuilder.andWhere('log.triggered_at <= :triggered_before', {
        triggered_before: new Date(triggered_before),
      });
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('log.triggered_at', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs.map(l => this.mapLogToResponseDto(l)),
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
   * Testa webhook enviando um payload de teste
   */
  async test(id: string): Promise<WebhookLogResponseDto> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new NotFoundException(`Webhook com ID ${id} nao encontrado`);
    }

    const testPayload = {
      test: true,
      message: 'Webhook test payload',
      timestamp: new Date().toISOString(),
    };

    await this.executeWebhook(webhook, 'incident.created' as WebhookEvent, testPayload);

    const log = await this.webhookLogRepository.findOne({
      where: { webhook_id: id },
      order: { triggered_at: 'DESC' },
    });

    if (!log) {
      throw new Error('Log nao encontrado apos teste');
    }

    return this.mapLogToResponseDto(log);
  }

  private extractAxiosError(error: unknown): AxiosErrorResponse {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as AxiosErrorResponse;
      return {
        response: {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        },
      };
    }
    return {};
  }

  private generateSignature(payload: Record<string, unknown>, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  private calculateRetryDelay(attemptNumber: number): number {
    return Math.min(Math.pow(2, attemptNumber) * 1000, 30000);
  }

  private async logWebhookExecution(data: {
    webhook: Webhook;
    event: WebhookEvent | string;
    status: WebhookLogStatus;
    attemptNumber: number;
    requestPayload: Record<string, unknown>;
    requestHeaders?: Record<string, string>;
    httpStatus?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    responseTimeMs?: number;
    errorMessage?: string;
  }): Promise<void> {
    const log = this.webhookLogRepository.create({
      webhook_id: data.webhook.id,
      event: data.event,
      status: data.status,
      attempt_number: data.attemptNumber,
      request_payload: data.requestPayload,
      request_headers: data.requestHeaders,
      http_status: data.httpStatus,
      response_body: data.responseBody,
      response_headers: data.responseHeaders,
      response_time_ms: data.responseTimeMs,
      error_message: data.errorMessage,
      triggered_at: new Date(),
    });

    await this.webhookLogRepository.save(log);
  }

  private mapToResponseDto(webhook: Webhook): WebhookResponseDto {
    return {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
      has_secret: !!webhook.secret,
      custom_headers: webhook.custom_headers,
      max_retries: webhook.max_retries,
      timeout_ms: webhook.timeout_ms,
      description: webhook.description,
      metadata: webhook.metadata,
      last_triggered_at: webhook.last_triggered_at,
      consecutive_failures: webhook.consecutive_failures,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    };
  }

  private mapLogToResponseDto(log: WebhookLog): WebhookLogResponseDto {
    return {
      id: log.id,
      webhook_id: log.webhook_id,
      event: log.event,
      status: log.status,
      http_status: log.http_status,
      attempt_number: log.attempt_number,
      request_payload: log.request_payload,
      request_headers: log.request_headers,
      response_body: log.response_body,
      response_headers: log.response_headers,
      response_time_ms: log.response_time_ms,
      error_message: log.error_message,
      triggered_at: log.triggered_at,
      created_at: log.created_at,
    };
  }
}
