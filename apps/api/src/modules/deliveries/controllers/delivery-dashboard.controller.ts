import { Controller, Get, Query, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@nexus/auth';
import { DeliveryDashboardService } from '../services/delivery-dashboard.service';
import {
  TopEstadoDto,
  TopClienteDto,
  DeliveryDashboardFilterDto,
} from '../dto/dashboard-stats.dto';

/**
 * Controller do Dashboard de Entregas
 *
 * Fornece endpoints para visualização de estatísticas
 * e dados agregados para o dashboard do sistema.
 *
 * Requer autenticação JWT para acessar.
 */
@ApiTags('Delivery Dashboard')
@Controller('deliveries/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DeliveryDashboardController {
  constructor(private readonly dashboardService: DeliveryDashboardService) {}

  @Get('top-estados')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter top estados por volume de entregas',
    description: `
Retorna os estados com maior volume de entregas, ordenados por quantidade.
Inclui nome do estado, sigla, quantidade de entregas e percentual em relação ao total.

Filtros disponíveis:
- Período de datas (start_date, end_date)
- Status das entregas
- Limite de resultados (padrão: 5)

Exemplo de uso:
GET /deliveries/dashboard/top-estados?limit=10&status=DELIVERED
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top estados retornados com sucesso',
    type: [TopEstadoDto],
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Data de início do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2024-12-31',
    description: 'Data de fim do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'],
    description: 'Status das entregas para filtrar',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 5,
    description: 'Quantidade de resultados a retornar (padrão: 5)',
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getTopEstados(@Query() filterDto: DeliveryDashboardFilterDto): Promise<TopEstadoDto[]> {
    return this.dashboardService.getTopEstados(filterDto);
  }

  @Get('top-clientes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter top clientes por volume de entregas',
    description: `
Retorna os clientes com maior volume de entregas, ordenados por quantidade.
Inclui ID, nome, categoria do cliente e quantidade de entregas.

Filtros disponíveis:
- Período de datas (start_date, end_date)
- Status das entregas
- Limite de resultados (padrão: 5)

Exemplo de uso:
GET /deliveries/dashboard/top-clientes?limit=10&status=DELIVERED
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top clientes retornados com sucesso',
    type: [TopClienteDto],
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Data de início do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2024-12-31',
    description: 'Data de fim do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'],
    description: 'Status das entregas para filtrar',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 5,
    description: 'Quantidade de resultados a retornar (padrão: 5)',
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getTopClientes(@Query() filterDto: DeliveryDashboardFilterDto): Promise<TopClienteDto[]> {
    return this.dashboardService.getTopClientes(filterDto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter estatísticas gerais de entregas',
    description: `
Retorna estatísticas agregadas de entregas:
- Total de entregas no período
- Entregas de hoje
- Entregas em trânsito
- Entregas entregues
- Entregas pendentes
- Entregas falhadas

Filtros disponíveis:
- Período de datas (start_date, end_date)

Exemplo de uso:
GET /deliveries/dashboard/stats?start_date=2024-01-01&end_date=2024-12-31
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 1500 },
        today: { type: 'number', example: 45 },
        inTransit: { type: 'number', example: 120 },
        delivered: { type: 'number', example: 1300 },
        pending: { type: 'number', example: 50 },
        failed: { type: 'number', example: 30 },
      },
    },
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Data de início do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2024-12-31',
    description: 'Data de fim do período (ISO 8601)',
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getStats(@Query() filterDto: DeliveryDashboardFilterDto): Promise<{
    total: number;
    today: number;
    inTransit: number;
    delivered: number;
    pending: number;
    failed: number;
  }> {
    return this.dashboardService.getStats(filterDto);
  }
}
