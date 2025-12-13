# @nexus/seeding

Pacote de utilitários para popular o banco de dados com dados iniciais do NexusTransit.

## Funcionalidades

- Seed de roles/permissões do sistema
- Criação de usuário administrador padrão
- Geração de usuários de teste para desenvolvimento

## Uso

### Executar todos os seeds

```bash
pnpm --filter @nexus/seeding seed
```

### Executar seeds específicos

```bash
# Apenas roles
pnpm --filter @nexus/seeding seed:roles

# Apenas admin
pnpm --filter @nexus/seeding seed:admin

# Apenas usuários de teste
pnpm --filter @nexus/seeding seed:users
```

## Seeds Disponíveis

### Roles Seed
Cria as roles padrão do sistema:
- ADMIN
- MANAGER
- DRIVER
- CUSTOMER

### Admin User Seed
Cria o usuário administrador padrão:
- Email: admin@nexustransit.com
- Senha: Admin@123
- Role: ADMIN

### Test Users Seed
Cria usuários de teste para desenvolvimento:
- Manager de teste
- Motorista de teste
- Cliente de teste

## Integração

```typescript
import { SeedingModule } from '@nexus/seeding';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    // ... outros módulos
    TypeOrmModule.forRoot({
      // configurações do TypeORM
    }),
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Registrar o módulo de seeding com o DataSource
    const seedingModule = SeedingModule.forRoot(this.dataSource);
  }
}
```

## Aviso

Os seeds são idempotentes e podem ser executados múltiplas vezes sem duplicar dados.
