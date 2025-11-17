import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { TrendDataResponseDto } from './dto/trend-data-response.dto';
import { CategoryDistributionResponseDto } from './dto/category-distribution-response.dto';
import { PerformanceRankingResponseDto } from './dto/performance-ranking-response.dto';

/**
 * Dashboard Controller
 * 
 * Endpoints para métricas, KPIs e análises do sistema
 */
@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Buscar overview completo do dashboard',
    description: `
      Retorna todas as métricas consolidadas do sistema incluindo:
      - Métricas de entregas (total, concluídas, pendentes, taxa de sucesso)
      - Métricas de motoristas (disponíveis, em rota, utilização)
      - Métricas de veículos (ativos, em manutenção, distância percorrida)
      - Métricas de rotas (planejadas, em andamento, completadas)
      - Métricas financeiras (receita, custos, lucro, margem)
      - Métricas de performance (eficiência, qualidade, satisfação)
      - Comparação com período anterior
    `,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Data de início (obrigatório se period=CUSTOM)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'Data de fim (obrigatório se period=CUSTOM)',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overview do dashboard retornado com sucesso',
    type: DashboardOverviewResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para acessar dashboard',
  })
  async getOverview(
    @Query() filterDto: DashboardFilterDto,
  ): Promise<DashboardOverviewResponseDto> {
    return this.dashboardService.getOverview(filterDto);
  }

  @Get('trends/:metricName')
  @ApiOperation({
    summary: 'Buscar dados de tendência para gráficos',
    description: `
      Retorna série temporal de uma métrica específica para visualização em gráficos.
      
      Métricas disponíveis:
      - deliveries: Número de entregas por período
      - revenue: Receita por período
      - routes: Número de rotas por período
      
      Os dados incluem:
      - Valores diários/mensais dependendo do período
      - Total, média, mínimo e máximo
      - Análise de tendência (crescimento/decrescimento/estável)
      - Percentual de mudança em relação ao início do período
    `,
  })
  @ApiParam({
    name: 'metricName',
    description: 'Nome da métrica',
    enum: ['deliveries', 'revenue', 'routes'],
    example: 'deliveries',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados de tendência retornados com sucesso',
    type: TrendDataResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getTrendData(
    @Param('metricName') metricName: string,
    @Query() filterDto: DashboardFilterDto,
  ): Promise<TrendDataResponseDto> {
    return this.dashboardService.getTrendData(metricName, filterDto);
  }

  @Get('distribution/:categoryType')
  @ApiOperation({
    summary: 'Buscar distribuição por categoria',
    description: `
      Retorna distribuição de dados por categorias para gráficos de pizza/donut.
      
      Tipos de distribuição disponíveis:
      - deliveries_by_status: Entregas agrupadas por status
      - vehicles_by_type: Veículos agrupados por tipo
      - drivers_by_status: Motoristas agrupados por status
      
      Cada categoria inclui:
      - Nome da categoria
      - Contagem total
      - Percentual do total
      - Cor sugerida para visualização
    `,
  })
  @ApiParam({
    name: 'categoryType',
    description: 'Tipo de categoria',
    enum: ['deliveries_by_status', 'vehicles_by_type', 'drivers_by_status'],
    example: 'deliveries_by_status',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise (aplicável para métricas temporais)',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Distribuição retornada com sucesso',
    type: CategoryDistributionResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getCategoryDistribution(
    @Param('categoryType') categoryType: string,
    @Query() filterDto: DashboardFilterDto,
  ): Promise<CategoryDistributionResponseDto> {
    return this.dashboardService.getCategoryDistribution(categoryType, filterDto);
  }

  @Get('ranking/:rankingType')
  @ApiOperation({
    summary: 'Buscar ranking de performance',
    description: `
      Retorna ranking de performance de entidades do sistema.
      
      Tipos de ranking disponíveis:
      - top_drivers: Motoristas com mais entregas
      - top_vehicles: Veículos mais utilizados
      
      Cada item do ranking inclui:
      - ID e nome da entidade
      - Score (número de entregas, km percorridos, etc)
      - Posição no ranking
      - Metadados adicionais (taxa de sucesso, etc)
      
      Limitado aos top 10 por padrão.
    `,
  })
  @ApiParam({
    name: 'rankingType',
    description: 'Tipo de ranking',
    enum: ['top_drivers', 'top_vehicles'],
    example: 'top_drivers',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ranking retornado com sucesso',
    type: PerformanceRankingResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getPerformanceRanking(
    @Param('rankingType') rankingType: string,
    @Query() filterDto: DashboardFilterDto,
  ): Promise<PerformanceRankingResponseDto> {
    return this.dashboardService.getPerformanceRanking(rankingType, filterDto);
  }

  @Get('kpis/deliveries')
  @ApiOperation({
    summary: 'Buscar KPIs específicos de entregas',
    description: `
      Retorna apenas métricas relacionadas a entregas de forma otimizada.
      
      Útil para widgets específicos de entregas no dashboard que não precisam
      de todas as métricas do overview completo.
    `,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs de entregas retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getDeliveryKPIs(@Query() filterDto: DashboardFilterDto) {
    const overview = await this.dashboardService.getOverview(filterDto);
    return {
      period: overview.period,
      start_date: overview.start_date,
      end_date: overview.end_date,
      metrics: overview.metrics.deliveries,
      generated_at: new Date(),
    };
  }

  @Get('kpis/financial')
  @ApiOperation({
    summary: 'Buscar KPIs financeiros',
    description: `
      Retorna apenas métricas financeiras de forma otimizada.
      
      Útil para widgets financeiros no dashboard que não precisam
      de todas as métricas do overview completo.
    `,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs financeiros retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getFinancialKPIs(@Query() filterDto: DashboardFilterDto) {
    const overview = await this.dashboardService.getOverview(filterDto);
    return {
      period: overview.period,
      start_date: overview.start_date,
      end_date: overview.end_date,
      metrics: overview.metrics.financial,
      comparison: overview.comparison,
      generated_at: new Date(),
    };
  }

  @Get('kpis/performance')
  @ApiOperation({
    summary: 'Buscar KPIs de performance',
    description: `
      Retorna apenas métricas de performance de forma otimizada.
      
      Inclui scores de eficiência, qualidade e satisfação.
    `,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs de performance retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getPerformanceKPIs(@Query() filterDto: DashboardFilterDto) {
    const overview = await this.dashboardService.getOverview(filterDto);
    return {
      period: overview.period,
      start_date: overview.start_date,
      end_date: overview.end_date,
      metrics: overview.metrics.performance,
      generated_at: new Date(),
    };
  }

  @Get('kpis/fleet')
  @ApiOperation({
    summary: 'Buscar KPIs da frota (veículos e motoristas)',
    description: `
      Retorna métricas consolidadas de veículos e motoristas.
      
      Útil para gestão de frota e recursos humanos.
    `,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Período de análise',
    enum: [
      'TODAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'CURRENT_MONTH',
      'LAST_MONTH',
      'LAST_3_MONTHS',
      'LAST_6_MONTHS',
      'CURRENT_YEAR',
      'CUSTOM',
    ],
    example: 'LAST_30_DAYS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs da frota retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getFleetKPIs(@Query() filterDto: DashboardFilterDto) {
    const overview = await this.dashboardService.getOverview(filterDto);
    return {
      period: overview.period,
      start_date: overview.start_date,
      end_date: overview.end_date,
      drivers: overview.metrics.drivers,
      vehicles: overview.metrics.vehicles,
      generated_at: new Date(),
    };
  }
}
