import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check geral',
    description: 'Verifica o status geral da aplicação (database, memória, disco)',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação saudável',
  })
  @ApiResponse({
    status: 503,
    description: 'Aplicação com problemas',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Verificar conexão com PostgreSQL
      () => this.db.pingCheck('database'),

      // Verificar uso de memória (alerta se > 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Verificar uso de disco (alerta se > 90%)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Verifica se a aplicação está pronta para receber requisições',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação pronta',
  })
  @ApiResponse({
    status: 503,
    description: 'Aplicação não está pronta',
  })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Verificar se o banco está pronto para receber queries
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Verifica se a aplicação está em execução',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação viva',
  })
  @ApiResponse({
    status: 503,
    description: 'Aplicação com problemas',
  })
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Verificar se a aplicação está viva
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('database')
  @HealthCheck()
  @ApiOperation({
    summary: 'Database check',
    description: 'Verifica a conexão com o banco de dados',
  })
  @ApiResponse({
    status: 200,
    description: 'Banco de dados conectado',
  })
  @ApiResponse({
    status: 503,
    description: 'Banco de dados desconectado',
  })
  database(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
