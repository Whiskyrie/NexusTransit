# @nexus/rate-limit

Sistema de rate limiting e throttling para o NexusTransit.

## Instalação

```bash
pnpm add @nexus/rate-limit
```

## Funcionalidades

- Rate limiting por IP
- Rate limiting por usuário
- Rate limiting por rota
- Decoradores `@RateLimit`
- Bypass com `@SkipRateLimit`
- Backend Redis

## Uso

```typescript
import { RateLimitModule } from '@nexus/rate-limit';

@Module({
  imports: [RateLimitModule],
})
export class AppModule {}
```

### Decorador

```typescript
import { RateLimit } from '@nexus/rate-limit';

@Controller('api')
export class ApiController {
  @Get()
  @RateLimit({ limit: 100, windowMs: 60000 })
  async getData() {
    return { data: [] };
  }
}
```

## Licença

UNLICENSED - Propriedade do NexusTransit
