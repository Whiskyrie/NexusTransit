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
import { RedisHealthIndicator } from './indicators/redis.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check geral',
    description: 'Verifica o status geral da aplicação (database, memória, disco, Redis)',
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

      // Verificar conexão com Redis
      () => this.redis.isHealthy('redis'),

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
    description: 'Verifica a conexão com o banco de dados PostgreSQL',
  })
  @ApiResponse({
    status: 200,
    description: 'Database conectado',
  })
  @ApiResponse({
    status: 503,
    description: 'Database com problemas',
  })
  database(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({
    summary: 'Redis check',
    description: 'Verifica a conexão com o Redis',
  })
  @ApiResponse({
    status: 200,
    description: 'Redis conectado',
  })
  @ApiResponse({
    status: 503,
    description: 'Redis com problemas',
  })
  checkRedis(): Promise<HealthCheckResult> {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }
}
