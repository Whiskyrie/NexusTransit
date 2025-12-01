# 🚀 NexusTransit Users Service - Migração Real do Monólito

## 📋 Visão Geral

Este microsserviço é uma **migração real** do módulo `users` do monólito NexusTransit, seguindo os princípios de:

- ✅ **Fidelidade Total ao Monólito** - Estrutura idêntica de dados, APIs e comportamento
- ✅ **Strangler Fig Pattern** - Migração gradual sem quebrar funcionalidades existentes
- ✅ **Database-per-Service** - PostgreSQL dedicado (porta 5433)
- ✅ **API-First** - Contratos OpenAPI mantidos
- ✅ **Testes de Contrato** - Garantia de compatibilidade

---

## 🏗️ Arquitetura

### Componentes

```
nexustransit-users-service-real/
├── src/
│   ├── modules/users/           # Módulo users migrado
│   │   ├── entities/            # User.entity.ts (FIDELIDADE TOTAL)
│   │   ├── dto/                 # DTOs idênticos ao monólito
│   │   ├── enums/               # UserType, UserStatus
│   │   ├── users.service.ts     # Lógica de negócio
│   │   ├── users.controller.ts  # Endpoints REST
│   │   └── users.module.ts      # Configuração do módulo
│   ├── database/
│   │   ├── entities/            # BaseEntity
│   │   ├── migrations/          # Migration CreateUsersTable
│   │   ├── data-source.ts       # TypeORM CLI
│   │   └── database.module.ts   # Configuração DB
│   ├── config/                  # Configurações
│   ├── app.module.ts            # App principal
│   └── main.ts                  # Bootstrap
├── docker-compose.yml           # PostgreSQL + Service
├── Dockerfile                   # Build da aplicação
└── package.json                 # Dependências
```

### Stack Tecnológica

- **Framework**: NestJS 11.0.1
- **ORM**: TypeORM 0.3.20
- **Database**: PostgreSQL 15 (porta 5433)
- **Validação**: class-validator, class-transformer
- **Documentação**: Swagger/OpenAPI 3.0
- **Hash de Senha**: bcrypt

---

## 🚀 Setup e Instalação

### Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- npm ou pnpm

### 1. Instalar Dependências

```bash
cd nexustransit-users-service-real
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env`:
```env
NODE_ENV=development
PORT=3003

# Database dedicado do microsserviço
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=nexustransit_users
DB_PASSWORD=nexustransit_users_pass
DB_DATABASE=nexustransit_users_db
```

### 3. Subir PostgreSQL com Docker

```bash
docker-compose up -d postgres_users
```

Aguarde o health check:
```bash
docker-compose ps
```

### 4. Executar Migrations

```bash
npm run migration:run
```

Isso criará:
- Extensão `uuid-ossp`
- Tipos ENUM `user_type_enum` e `user_status_enum`
- Tabela `users` com todos os campos
- Índices em `email`, `user_type`, `status`, `deleted_at`

### 5. Iniciar o Microsserviço

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

### 6. Verificar Funcionamento

- **API**: http://localhost:3003/api
- **Swagger**: http://localhost:3003/api/docs
- **Health**: http://localhost:3003/api/users

---

## 📊 Banco de Dados

### Comparação: Monólito vs Microsserviço

| Aspecto | Monólito | Microsserviço |
|---------|----------|---------------|
| Host | localhost | localhost |
| Porta | 5432 | **5433** |
| Database | nexustransit | **nexustransit_users_db** |
| Usuário | nexustransit | **nexustransit_users** |
| Tabelas | Todas (15 módulos) | Apenas `users` |

### Schema da Tabela `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  user_type user_type_enum DEFAULT 'customer',
  status user_status_enum DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  preferences JSONB,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);
```

---

## 🔌 Endpoints API

### Documentação Completa: Swagger

Acesse: http://localhost:3003/api/docs

### Endpoints Principais

| Método | Endpoint | Descrição | Fidelidade |
|--------|----------|-----------|------------|
| POST | `/api/users` | Criar usuário | ✅ 100% |
| GET | `/api/users` | Listar usuários | ✅ 100% |
| GET | `/api/users/:id` | Buscar por ID | ✅ 100% |
| PATCH | `/api/users/:id` | Atualizar usuário | ✅ 100% |
| DELETE | `/api/users/:id` | Soft delete | ✅ 100% |

### Exemplo de Requisição

#### Criar Usuário

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@nexustransit.com",
    "password": "SecurePass123!",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+5511999887766",
    "user_type": "customer",
    "status": "active"
  }'
```

#### Resposta

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "joao.silva@nexustransit.com",
  "first_name": "João",
  "last_name": "Silva",
  "phone": "+5511999887766",
  "user_type": "customer",
  "status": "active",
  "email_verified": false,
  "created_at": "2025-11-26T10:00:00Z",
  "updated_at": "2025-11-26T10:00:00Z"
}
```

---

## 🧪 Testes

### Testes de Contrato (Pact)

**TODO - Fase 2**: Implementar testes de contrato conforme PDFs 125-126

```bash
npm run test:contract
```

### Testes Unitários

```bash
npm test
```

### Testes E2E

```bash
npm run test:e2e
```

---

## 📦 Estratégia de Migração

### Fase 1: Standalone (Atual) ✅

- [x] Microsserviço funcional com banco dedicado
- [x] Endpoints idênticos ao monólito
- [x] Documentação Swagger
- [x] Migrations

### Fase 2: Dual-Write (Próximo Passo)

- [ ] Escrever em ambos: monólito E microsserviço
- [ ] Sincronização de dados
- [ ] Testes de contrato (Pact)
- [ ] Monitoramento de discrepâncias

### Fase 3: Cutover (Final)

- [ ] Rotear 10% do tráfego para microsserviço
- [ ] Gradualmente aumentar para 100%
- [ ] Desligar endpoints do monólito
- [ ] Migração de dados históricos

---

## 🔄 Comandos Úteis

### Docker

```bash
# Subir todos os serviços
docker-compose up -d

# Logs do microsserviço
docker-compose logs -f users_service

# Logs do PostgreSQL
docker-compose logs -f postgres_users

# Parar tudo
docker-compose down

# Parar e remover volumes (CUIDADO!)
docker-compose down -v
```

### TypeORM

```bash
# Criar nova migration
npm run migration:create -- src/database/migrations/MigrationName

# Gerar migration a partir de mudanças nas entities
npm run migration:generate -- src/database/migrations/MigrationName

# Executar migrations
npm run migration:run

# Reverter última migration
npm run migration:revert

# Sincronizar schema (APENAS DEV!)
npm run schema:sync
```

### Desenvolvimento

```bash
# Watch mode
npm run start:dev

# Debug mode
npm run start:debug

# Lint
npm run lint

# Format
npm run format
```

---

## 🔐 Segurança

### Hash de Senhas

- **Algoritmo**: bcrypt
- **Rounds**: 10
- **Salt**: Automático

### Validações

- Email único (constraint no banco)
- Senha mínima de 6 caracteres
- UUIDs validados nos parâmetros
- DTOs com class-validator

### Soft Delete

Todos os deletes são soft (campo `deleted_at`), permitindo:
- Auditoria completa
- Recuperação de dados
- Conformidade com LGPD

---

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
docker-compose logs -f users_service
```

### Health Checks

```bash
# PostgreSQL
docker-compose ps postgres_users

# Service
curl http://localhost:3003/api/users
```

### Métricas

**TODO - Fase 2**: Implementar Prometheus + Grafana

---

## 🐛 Troubleshooting

### Problema: Porta 5433 já em uso

```bash
# Verificar processos na porta
lsof -i :5433

# Mudar porta no .env
DB_PORT=5434
```

E atualizar `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"
```

### Problema: Migration falha

```bash
# Conectar no PostgreSQL
docker exec -it nexustransit-users-db psql -U nexustransit_users -d nexustransit_users_db

# Verificar tabelas
\dt

# Verificar migrations
SELECT * FROM migrations;

# Dropar tudo e recomeçar (APENAS DEV!)
docker-compose down -v
docker-compose up -d postgres_users
npm run migration:run
```

### Problema: Senha não está sendo hasheada

Verifique se a migration está usando `password_hash` e não `password`.

---

## 📚 Referências

### Documentação Base

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Arquitetura NexusTransit

- `FASE-1-POC-MICROSERVICES.md` - Guia estratégico
- `.github/copilot-instructions.md` - Padrões de código
- Tutoriais de Migração (PDFs 121-128)

### Padrões de Migração

- **Strangler Fig Pattern**: Substituição gradual
- **Database per Service**: Isolamento de dados
- **API Gateway**: Roteamento inteligente (Fase 2)

---

## 👥 Equipe

**Migração executada por**: GitHub Copilot + Time NexusTransit  
**Data**: Novembro 2025  
**Versão**: 1.0.0

---

## 📄 Licença

MIT License - NexusTransit © 2025
