import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { getPinoConfig } from './config/pino.config';
import { MetricsService } from './services/metrics.service';
import { MetricsController } from './controllers/metrics.controller';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

/**
 * Módulo de Logging e Monitoramento
 *
 * Recursos:
 * - Pino Logger estruturado (JSON em prod, pretty em dev)
 * - Correlation IDs automáticos em todas as requests
 * - Performance tracking com alertas para requests lentas
 * - Exception filter global com logs estruturados
 * - Métricas HTTP, erros e sistema em tempo real
 * - Endpoints de métricas (/metrics)
 *
 * @Global para disponibilizar em toda a aplicação
 */
@Global()
@Module({
  imports: [LoggerModule.forRoot(getPinoConfig())],
  providers: [
    MetricsService,
    CorrelationIdInterceptor,
    PerformanceInterceptor,
    AllExceptionsFilter,
    // Aplicar interceptors globalmente
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    // Aplicar exception filter globalmente
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  controllers: [MetricsController],
  exports: [
    LoggerModule,
    MetricsService,
    CorrelationIdInterceptor,
    PerformanceInterceptor,
    AllExceptionsFilter,
  ],
})
export class LoggingModule {}
