# @nexus/logger

Sistema de logging estruturado com Pino para o NexusTransit.

## Instalação

```bash
pnpm add @nexus/logger
```

## Funcionalidades

- Logs estruturados em JSON (produção)
- Pretty logging (desenvolvimento)
- Correlation IDs automáticos
- Performance tracking
- Métricas HTTP
- Integração com NestJS

## Uso

```typescript
import { LoggingModule } from '@nexus/logger';

@Module({
  imports: [LoggingModule],
})
export class AppModule {}
```

## API

```typescript
// Via injeção
constructor(private readonly logger: PinoLogger) {}

// Logs
this.logger.log('Operação realizada');
this.logger.error('Erro ocorrido', error);
this.logger.warn('Aviso importante');
this.logger.debug('Debug info');
```

## Licença

UNLICENSED - Propriedade do NexusTransit
