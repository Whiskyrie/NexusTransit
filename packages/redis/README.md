# @nexus/redis

Cliente Redis/Keyv compartilhado para cache e sessões no NexusTransit.

## Instalação

```bash
pnpm add @nexus/redis
```

## Funcionalidades

- Cliente Keyv com Redis backend
- Operações GET/SET/DELETE
- TTL configurável
- Namespace automático
- Type-safe
- Async/await

## Uso

### Importar o módulo

```typescript
import { RedisModule } from '@nexus/redis';

@Module({
  imports: [
    RedisModule.forRootAsync(),
  ],
})
export class AppModule {}
```

### Injetar o serviço

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@nexus/redis';

@Injectable()
export class AuthService {
  constructor(private readonly redis: RedisService) {}

  async blacklistToken(token: string): Promise<void> {
    await this.redis.set(`blacklist:${token}`, true, 3600); // TTL 1h
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redis.get(`blacklist:${token}`);
    return exists !== null;
  }
}
```

## Configuração

### Variáveis de Ambiente

```env
REDIS_URL=redis://localhost:6379
# ou
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
```

## API

### RedisService

```typescript
class RedisService {
  // Obter valor
  async get<T>(key: string): Promise<T | null>

  // Definir valor com TTL opcional
  async set<T>(key: string, value: T, ttl?: number): Promise<void>

  // Deletar chave
  async del(key: string): Promise<void>

  // Verificar existência
  async has(key: string): Promise<boolean>

  // Limpar namespace
  async clear(): Promise<void>
}
```

## Exemplos de Uso

### Cache de dados

```typescript
async getCachedUser(id: string): Promise<User> {
  // Tentar buscar do cache
  const cached = await this.redis.get<User>(`user:${id}`);
  if (cached) return cached;

  // Se não existir, buscar do DB
  const user = await this.usersRepository.findOne(id);

  // Armazenar no cache por 5 minutos
  await this.redis.set(`user:${id}`, user, 300);

  return user;
}
```

### Sessões de usuário

```typescript
async createSession(userId: string, data: SessionData): Promise<string> {
  const sessionId = randomUUID();
  
  // Sessão expira em 24h
  await this.redis.set(`session:${sessionId}`, {
    userId,
    ...data,
  }, 86400);

  return sessionId;
}

async getSession(sessionId: string): Promise<SessionData | null> {
  return this.redis.get<SessionData>(`session:${sessionId}`);
}
```

### Rate limiting

```typescript
async checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const count = await this.redis.get<number>(key) || 0;

  if (count >= 100) {
    return false; // Bloqueado
  }

  // Incrementar contador (expira em 1 minuto)
  await this.redis.set(key, count + 1, 60);
  return true;
}
```

### Token blacklist

```typescript
async blacklistToken(token: string, ttl: number): Promise<void> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await this.redis.set(`blacklist:${tokenHash}`, true, ttl);
}

async isTokenBlacklisted(token: string): Promise<boolean> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return this.redis.has(`blacklist:${tokenHash}`);
}
```

## Configuração Avançada

### Namespaces customizados

```typescript
// O namespace 'nexus' é adicionado automaticamente
await redis.set('user:123', data);
// Armazenado como: nexus:user:123
```

### Conexão com senha

```env
REDIS_URL=redis://:password@localhost:6379
```

### Redis Cloud/Upstash

```env
REDIS_URL=rediss://default:token@redis.example.com:6379
```

## Dependências

- `keyv`
- `@keyv/redis`
- `redis`

## Licença

UNLICENSED - Propriedade do NexusTransit
