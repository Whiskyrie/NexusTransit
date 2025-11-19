import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  // Criar app com buffer de logs para aguardar Pino Logger estar pronto
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Configurar Pino Logger como logger global
  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');
  const port = appConfig?.port ?? 3000;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NexusTransit API')
    .setDescription(
      'API para gerenciamento de entregas, rotas, motoristas, veículos e clientes do sistema NexusTransit',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('Users', 'Gerenciamento de usuários')
    .addTag('Drivers', 'Gerenciamento de motoristas')
    .addTag('Vehicles', 'Gerenciamento de veículos')
    .addTag('Customers', 'Gerenciamento de clientes')
    .addTag('Deliveries', 'Gerenciamento de entregas')
    .addTag('Routes', 'Gerenciamento de rotas')
    .addTag('Tracking', 'Rastreamento em tempo real')
    .addTag('Reports', 'Relatórios e analytics')
    .addTag('Incidents', 'Gerenciamento de incidentes')
    .addTag('LGPD', 'Conformidade LGPD')
    .addTag('Health', 'Health checks')
    .addTag('Metrics', 'Métricas e monitoramento')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'NexusTransit API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  await app.listen(port);

  // Log de inicialização usando Pino Logger
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
