# @nexus/database

Factory e configurações do TypeORM para conexão PostgreSQL no NexusTransit.

## Instalação

```bash
pnpm add @nexus/database
```

## Funcionalidades

- DataSource factory configurável
- Suporte a migrations
- Configuração via environment
- Pool de conexões otimizado
- Logging condicional
- SSL/TLS support

## Uso

### Importar o módulo

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@nexus/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      entities: [User, Vehicle, Driver],
      migrations: ['./migrations/*.ts'],
    }),
  ],
})
export class AppModule {}
```

### Criar DataSource para migrations

```typescript
import { createDataSource } from '@nexus/database';
import { User } from './entities/user.entity';

export default createDataSource({
  entities: [User, Vehicle],
  migrations: ['./src/database/migrations/*.ts'],
});
```

## Configuração

### Variáveis de Ambiente

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nexustransit
DB_SCHEMA=public

# SSL (opcional)
DB_SSL_ENABLED=false
DB_SSL_REJECT_UNAUTHORIZED=true

# Pool
DB_POOL_MIN=2
DB_POOL_MAX=10

# Logging
DB_LOGGING=false
```

### Opções do DataSource

```typescript
interface DataSourceOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  entities: any[];
  migrations?: string[];
  synchronize?: boolean;
  logging?: boolean | string[];
  ssl?: {
    enabled: boolean;
    rejectUnauthorized?: boolean;
  };
  pool?: {
    min?: number;
    max?: number;
  };
}
```

## API

### createDataSource

```typescript
function createDataSource(options: DataSourceOptions): DataSource
```

Cria uma instância configurada do TypeORM DataSource.

### DatabaseModule

```typescript
class DatabaseModule {
  static forRoot(options?: DataSourceOptions): DynamicModule
  static forRootAsync(options: AsyncOptions): DynamicModule
}
```

## Migrations

### Criar migration

```bash
pnpm typeorm migration:create ./src/database/migrations/CreateUsers
```

### Gerar migration

```bash
pnpm typeorm migration:generate ./src/database/migrations/UpdateUsers
```

### Executar migrations

```bash
pnpm typeorm migration:run
```

### Reverter migration

```bash
pnpm typeorm migration:revert
```

## Exemplo Completo

```typescript
// ormconfig.ts
import { createDataSource } from '@nexus/database';
import { User } from './modules/users/entities/user.entity';
import { Vehicle } from './modules/vehicles/entities/vehicle.entity';

export default createDataSource({
  entities: [User, Vehicle],
  migrations: ['./src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
```

```typescript
// app.module.ts
import { DatabaseModule } from '@nexus/database';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    DatabaseModule.forRoot({
      entities: [User, Vehicle, Driver],
    }),
  ],
})
export class AppModule {}
```

## Dependências

- `@nestjs/typeorm`
- `typeorm`
- `pg` (PostgreSQL driver)

## Licença

UNLICENSED - Propriedade do NexusTransit
