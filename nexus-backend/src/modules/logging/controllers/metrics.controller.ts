import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import * as metricsInterface from '../interfaces/metrics.interface';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter todas as métricas',
    description: 'Retorna métricas HTTP, erros, requisições lentas e métricas do sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas retornadas com sucesso',
  })
  getAllMetrics(): {
    http: metricsInterface.HttpMetricsSummary;
    errors: metricsInterface.ErrorMetricsSummary;
    slowRequests: {
      totalSlowRequests: number;
      slowRequests: metricsInterface.SlowRequestMetric[];
    };
    system: metricsInterface.SystemMetrics;
    timestamp: string;
  } {
    return this.metricsService.getAllMetrics();
  }

  @Get('http')
  @ApiOperation({
    summary: 'Obter métricas HTTP',
    description:
      'Retorna métricas de requisições HTTP da última hora (total, sucesso, erros, duração)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas HTTP retornadas com sucesso',
  })
  getHttpMetrics(): metricsInterface.HttpMetricsSummary {
    return this.metricsService.getHttpMetrics();
  }

  @Get('errors')
  @ApiOperation({
    summary: 'Obter métricas de erros',
    description: 'Retorna métricas de erros da última hora agrupadas por tipo e rota',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de erros retornadas com sucesso',
  })
  getErrorMetrics(): metricsInterface.ErrorMetricsSummary {
    return this.metricsService.getErrorMetrics();
  }

  @Get('slow')
  @ApiOperation({
    summary: 'Obter métricas de requisições lentas',
    description: 'Retorna requisições que demoraram mais de 2 segundos para completar',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de requisições lentas retornadas com sucesso',
  })
  getSlowRequestMetrics(): {
    totalSlowRequests: number;
    slowRequests: metricsInterface.SlowRequestMetric[];
  } {
    return this.metricsService.getSlowRequestMetrics();
  }

  @Get('system')
  @ApiOperation({
    summary: 'Obter métricas do sistema',
    description: 'Retorna métricas do sistema (memória, uptime, versão do Node)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas do sistema retornadas com sucesso',
  })
  getSystemMetrics(): metricsInterface.SystemMetrics {
    return this.metricsService.getSystemMetrics();
  }
}
