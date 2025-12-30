import { Controller, Get, Query, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@nexus/auth';
import { AuditDashboardService } from '../services/audit-dashboard.service';
import { AuditRequestInterceptor } from '../interceptors/audit-request.interceptor';
import { AuditAccessGuard } from '../guards/audit-access.guard';
import {
  CanViewSecurityAlerts,
  RequireAuditPermission,
} from '../decorators/audit-access.decorator';
import { AuditPermission } from '../enums/audit-permission.enum';
import {
  AuditDashboardFilterDto,
  AuditTimelineFilterDto,
  AuditDashboardStatsDto,
  AuditDashboardResponseDto,
  AuditTopUserDto,
  AuditTopEntityDto,
  AuditSecurityAlertDto,
  AuditTimelineItemDto,
} from '../dto/audit-dashboard.dto';

/**
 * Controller do Dashboard de Auditoria
 *
 * Fornece endpoints para visualização de estatísticas,
 * análises e alertas de segurança dos logs de auditoria.
 *
 * Requer permissão VIEW_DASHBOARD para acessar.
 */
@ApiTags('Audit Dashboard')
@Controller('audit/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AuditAccessGuard)
@UseInterceptors(AuditRequestInterceptor)
@RequireAuditPermission(AuditPermission.VIEW_DASHBOARD)
export class AuditDashboardController {
  constructor(private readonly dashboardService: AuditDashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Dashboard completo de auditoria',
    description: `
Retorna uma visão consolidada do dashboard de auditoria incluindo:
- Estatísticas gerais (total de eventos, usuários ativos, distribuições)
- Top 10 usuários mais ativos
- Top 10 entidades mais modificadas
- Alertas de segurança ativos
- Atividades recentes (timeline)
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard de auditoria',
    type: AuditDashboardResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para acessar o dashboard',
  })
  async getDashboard(
    @Query() filterDto: AuditDashboardFilterDto,
  ): Promise<AuditDashboardResponseDto> {
    return this.dashboardService.getDashboard(filterDto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Estatísticas gerais de auditoria',
    description: `
Retorna estatísticas agregadas dos logs de auditoria:
- Total de eventos no período
- Variação em relação ao período anterior
- Usuários ativos
- Distribuição por tipo de ação (CREATE, UPDATE, DELETE, etc.)
- Distribuição por categoria
- Tendência de eventos por hora/dia
- Tempo médio de resposta
- Taxa de erro
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas de auditoria',
    type: AuditDashboardStatsDto,
  })
  async getStats(@Query() filterDto: AuditDashboardFilterDto): Promise<AuditDashboardStatsDto> {
    return this.dashboardService.getStats(filterDto);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Timeline de atividades recentes',
    description: `
Retorna as atividades mais recentes em formato de timeline.
Permite filtrar por:
- Tipo de ação
- Categoria
- Tipo de recurso
Limitado a 100 itens por requisição.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de atividades recentes',
    type: [AuditTimelineItemDto],
  })
  async getTimeline(@Query() filterDto: AuditTimelineFilterDto): Promise<AuditTimelineItemDto[]> {
    return this.dashboardService.getTimeline(filterDto);
  }

  @Get('top-users')
  @ApiOperation({
    summary: 'Top usuários mais ativos',
    description: `
Retorna os 10 usuários mais ativos no período especificado.
Inclui para cada usuário:
- Total de ações
- Última atividade
- Breakdown das ações (quantas de cada tipo)
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de top usuários',
    type: [AuditTopUserDto],
  })
  async getTopUsers(@Query() filterDto: AuditDashboardFilterDto): Promise<AuditTopUserDto[]> {
    const { startDate, endDate } = this.getDateRange(filterDto);
    return this.dashboardService.getTopUsers(startDate, endDate, filterDto.category);
  }

  @Get('top-entities')
  @ApiOperation({
    summary: 'Top entidades mais modificadas',
    description: `
Retorna os 10 tipos de entidade mais modificados no período.
Inclui para cada tipo:
- Total de modificações
- Breakdown (criações, atualizações, exclusões)
- Variação percentual em relação ao período anterior
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de top entidades',
    type: [AuditTopEntityDto],
  })
  async getTopEntities(@Query() filterDto: AuditDashboardFilterDto): Promise<AuditTopEntityDto[]> {
    const { startDate, endDate } = this.getDateRange(filterDto);
    return this.dashboardService.getTopEntities(startDate, endDate, filterDto.category);
  }

  @Get('alerts')
  @CanViewSecurityAlerts()
  @ApiOperation({
    summary: 'Alertas de segurança',
    description: `
Retorna alertas de segurança detectados automaticamente:
- **MULTIPLE_LOGIN_FAILURES**: Múltiplas tentativas de login falhas
- **BULK_DELETE**: Exclusão em massa de registros
- **HIGH_ACTIVITY**: Atividade anormalmente alta
- **MULTIPLE_IPS**: Acesso do mesmo usuário de múltiplos IPs

Alertas são ordenados por severidade (CRITICAL > HIGH > MEDIUM > LOW) e data.

**Requer permissão:** VIEW_SECURITY_ALERTS
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de alertas de segurança',
    type: [AuditSecurityAlertDto],
  })
  async getSecurityAlerts(): Promise<AuditSecurityAlertDto[]> {
    return this.dashboardService.getSecurityAlerts();
  }

  /**
   * Método auxiliar para extrair range de datas do filtro
   */
  private getDateRange(filterDto: AuditDashboardFilterDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    const endDate = filterDto.endDate ? new Date(filterDto.endDate) : now;

    let startDate: Date;
    if (filterDto.startDate) {
      startDate = new Date(filterDto.startDate);
    } else {
      const daysMap = {
        day: 1,
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };
      const days = daysMap[filterDto.period ?? 'week'];
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }
}
