# @nexus/seeding

Pacote de utilitários para popular o banco de dados com dados iniciais do NexusTransit.

## Funcionalidades

- Seed de 5 roles/permissões do sistema (ADMIN, GESTOR, DESPACHANTE, MOTORISTA, CLIENTE)
- Criação de usuário administrador padrão
- Geração de usuários de teste para cada role
- Suporte a diferentes ambientes (dev, test, prod)
- Rollback automático em caso de erro
- Idempotente (pode executar múltiplas vezes)
- Logs detalhados de execução

## Uso

### Executar todos os seeds

```bash
# Ambiente de desenvolvimento (padrão)
pnpm --filter @nexus/seeding seed:run

# Ambiente de teste
pnpm --filter @nexus/seeding seed:run --env=test

# Ambiente de produção (sem usuários de teste)
pnpm --filter @nexus/seeding seed:run --env=prod
```

### Executar seeds específicos

```bash
# Apenas roles
pnpm --filter @nexus/seeding seed:roles

# Apenas admin
pnpm --filter @nexus/seeding seed:admin

# Apenas usuários de teste
pnpm --filter @nexus/seeding seed:users

# Listar seeds disponíveis
pnpm --filter @nexus/seeding seed:list
```

## Seeds Disponíveis

### Roles Seed

Cria as 5 roles padrão do sistema com hierarquia:

| Role | Descrição | Nível |
|------|-----------|-------|
| ADMIN | Administrador com acesso total | 0 |
| GESTOR | Gestor de operações | 1 |
| DESPACHANTE | Despachante de entregas | 2 |
| MOTORISTA | Motorista | 3 |
| CLIENTE | Cliente | 4 |

### Admin User Seed

Cria o usuário administrador padrão:

- **Email:** admin@nexustransit.com
- **Senha:** Admin@123
- **Role:** ADMIN

### Test Users Seed

Cria usuários de teste para cada role:

- admin.teste@nexustransit.com (ADMIN)
- gestor.teste@nexustransit.com (GESTOR)
- despachante.teste@nexustransit.com (DESPACHANTE)
- motorista.teste@nexustransit.com (MOTORISTA)
- cliente.teste@nexustransit.com (CLIENTE)

**Senha padrão para todos:** Test@123

**Nota:** Usuários de teste não são criados em ambiente de produção.

## Comportamento por Ambiente

| Ambiente | Roles | Admin | Usuários Teste |
|----------|-------|-------|----------------|
| dev | Sim | Sim | Sim |
| test | Sim | Sim | Sim |
| prod | Sim | Sim | Não |

## Integração

```typescript
import { SeedingModule } from '@nexus/seeding';
import { DataSource } from 'typeorm';

@Module({
  imports: [
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

## Observações

- Os seeds são idempotentes e podem ser executados múltiplas vezes sem duplicar dados
- Em caso de erro, um rollback automático é executado para manter a consistência
- Usuários de teste nunca são criados em produção por segurança
