import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard, RolesGuard, Roles, Role } from "@nexus/auth";
import { RateLimitService } from "./services/rate-limit.service";
import { MonitoringService } from "./services/monitoring.service";
import { BlacklistService, BlacklistEntry } from "./services/blacklist.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";
import { RuleFilterDto } from "./dto/rule-filter.dto";
import { RuleResponseDto } from "./dto/rule-response.dto";
import { QuotaMetricsDto } from "./dto/quota-metrics.dto";
import { PaginatedResponseDto } from "@nexus/common";

/**
 * Controller para gerenciamento de regras de rate limiting
 *
 * Endpoints para:
 * - CRUD de regras de rate limit
 * - Consulta de métricas e uso de quota
 * - Gerenciamento de whitelist/blacklist
 * - Monitoramento de violações
 */
@ApiTags("Rate Limit")
@Controller("rate-limit")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RateLimitController {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly monitoringService: MonitoringService,
    private readonly blacklistService: BlacklistService,
  ) {}

  @Post("rules")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Criar nova regra de rate limit",
    description: "Cria uma nova regra de rate limiting no sistema",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Regra criada com sucesso",
    type: RuleResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Dados inválidos fornecidos",
  })
  @ApiUnauthorizedResponse({
    description: "Token de autenticação inválido ou ausente",
  })
  @ApiForbiddenResponse({
    description: "Usuário não possui permissão de administrador",
  })
  async createRule(@Body() createDto: CreateRuleDto): Promise<RuleResponseDto> {
    return this.rateLimitService.createRule(createDto);
  }

  @Get("rules")
  @Roles(Role.ADMIN, Role.GESTOR)
  @ApiOperation({
    summary: "Listar regras de rate limit",
    description: "Lista todas as regras de rate limiting com filtros e paginação",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de regras",
    type: [RuleResponseDto],
  })
  async findAllRules(
    @Query() filterDto: RuleFilterDto,
  ): Promise<PaginatedResponseDto<RuleResponseDto>> {
    return this.rateLimitService.findAllRules(filterDto);
  }

  @Get("rules/:id")
  @Roles(Role.ADMIN, Role.GESTOR)
  @ApiOperation({
    summary: "Buscar regra por ID",
    description: "Retorna detalhes de uma regra específica",
  })
  @ApiParam({
    name: "id",
    description: "ID único da regra",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Regra encontrada",
    type: RuleResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Regra não encontrada",
  })
  async findOneRule(@Param("id", ParseUUIDPipe) id: string): Promise<RuleResponseDto> {
    return this.rateLimitService.findOneRule(id);
  }

  @Patch("rules/:id")
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Atualizar regra de rate limit",
    description: "Atualiza campos específicos de uma regra",
  })
  @ApiParam({
    name: "id",
    description: "ID único da regra",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Regra atualizada com sucesso",
    type: RuleResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Regra não encontrada",
  })
  async updateRule(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRuleDto,
  ): Promise<RuleResponseDto> {
    return this.rateLimitService.updateRule(id, updateDto);
  }

  @Delete("rules/:id")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remover regra de rate limit",
    description: "Remove (soft delete) uma regra do sistema",
  })
  @ApiParam({
    name: "id",
    description: "ID único da regra",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Regra removida com sucesso",
  })
  @ApiNotFoundResponse({
    description: "Regra não encontrada",
  })
  async removeRule(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.rateLimitService.removeRule(id);
  }

  @Get("metrics/quota")
  @Roles(Role.ADMIN, Role.GESTOR)
  @ApiOperation({
    summary: "Obter métricas de uso de quota",
    description: "Retorna estatísticas agregadas de uso das quotas de rate limit",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Métricas de quota",
    type: QuotaMetricsDto,
  })
  async getQuotaMetrics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<QuotaMetricsDto> {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.monitoringService.getQuotaMetrics(parsedStartDate, parsedEndDate);
  }

  @Get("metrics/violations")
  @Roles(Role.ADMIN, Role.GESTOR)
  @ApiOperation({
    summary: "Obter relatório de violações",
    description: "Lista violações de rate limit com filtros por período",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de violações",
  })
  async getViolations(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("type") type?: "IP" | "USER" | "CLIENT_ID",
  ): Promise<
    {
      client_id: string;
      ip: string;
      user_id?: string;
      endpoint: string;
      method: string;
      rule_id?: string;
      blocked: boolean;
      request_time: Date;
    }[]
  > {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.monitoringService.getViolations(parsedStartDate, parsedEndDate, type);
  }

  @Post("whitelist")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Adicionar à whitelist",
    description: "Adiciona um IP ou usuário à whitelist (bypass de rate limit)",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Adicionado à whitelist com sucesso",
  })
  async addToWhitelist(
    @Body("identifier") identifier: string,
    @Body("type") type: "IP" | "USER",
    @Body("permanent") permanent?: boolean,
    @Body("ttlSeconds") ttlSeconds?: number,
  ): Promise<{ message: string }> {
    await this.blacklistService.addToWhitelist(identifier, type, permanent ?? true, ttlSeconds);
    return { message: "Adicionado à whitelist com sucesso" };
  }

  @Delete("whitelist/:identifier")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remover da whitelist",
    description: "Remove um IP ou usuário da whitelist",
  })
  @ApiParam({
    name: "identifier",
    description: "IP ou ID do usuário",
  })
  async removeFromWhitelist(
    @Param("identifier") identifier: string,
    @Query("type") type: "IP" | "USER",
  ): Promise<void> {
    await this.blacklistService.removeFromWhitelist(identifier, type);
  }

  @Post("blacklist")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Adicionar à blacklist",
    description: "Adiciona um IP ou usuário à blacklist (bloqueia acesso)",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Adicionado à blacklist com sucesso",
  })
  async addToBlacklist(
    @Body("identifier") identifier: string,
    @Body("type") type: "IP" | "USER",
    @Body("reason") reason?: string,
    @Body("durationSeconds") durationSeconds?: number,
  ): Promise<{ message: string }> {
    // Construir objeto options apenas com propriedades definidas
    const options: {
      reason?: string;
      durationSeconds?: number;
      createdBy?: string;
    } = {};

    if (reason !== undefined) {
      options.reason = reason;
    }

    if (durationSeconds !== undefined) {
      options.durationSeconds = durationSeconds;
    }

    await this.blacklistService.addToBlacklist(identifier, type, options);
    return { message: "Adicionado à blacklist com sucesso" };
  }

  @Delete("blacklist/:identifier")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remover da blacklist",
    description: "Remove um IP ou usuário da blacklist",
  })
  @ApiParam({
    name: "identifier",
    description: "IP ou ID do usuário",
  })
  async removeFromBlacklist(
    @Param("identifier") identifier: string,
    @Query("type") type: "IP" | "USER",
  ): Promise<void> {
    await this.blacklistService.removeFromBlacklist(identifier, type);
  }

  @Get("blacklist")
  @Roles(Role.ADMIN, Role.GESTOR)
  @ApiOperation({
    summary: "Listar entradas da blacklist",
    description: "Lista todos os IPs e usuários bloqueados",
  })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["IP", "USER"],
    description: "Filtrar por tipo de identificador",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    example: 1,
    description: "Número da página",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    example: 10,
    description: "Itens por página (máximo 100)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de blacklist",
  })
  async listBlacklist(
    @Query("type") type?: "IP" | "USER",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<{
    data: BlacklistEntry[];
    meta: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_previous: boolean;
      has_next: boolean;
    };
  }> {
    return this.blacklistService.listBlacklist(type, page, limit);
  }

  @Post("rules/:id/reset")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resetar contador de rate limit",
    description: "Reseta os contadores de uma regra específica",
  })
  @ApiParam({
    name: "id",
    description: "ID único da regra",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Contador resetado com sucesso",
  })
  async resetRuleCounter(@Param("id", ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.rateLimitService.resetRuleCounter(id);
    return { message: "Contador resetado com sucesso" };
  }
}
