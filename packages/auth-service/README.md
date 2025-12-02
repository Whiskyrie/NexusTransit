# 🔐 Auth Service - NexusTransit

Microserviço de autenticação e gerenciamento de usuários do NexusTransit.

## 📋 Descrição

O **Auth Service** é responsável por:
- 🔑 Autenticação via JWT (login, refresh, logout)
- 👥 Gerenciamento de usuários (CRUD)
- 🎭 Controle de papéis e permissões (RBAC)
- 🔒 Validação de tokens e sessões

Este é o **primeiro microserviço extraído** do monolito NexusTransit, seguindo padrão **Strangler Fig** para migração gradual.

---

## 🏗️ Arquitetura

### Módulos

```
src/
├── auth/              # Autenticação (login, refresh, logout)
├── users/             # Gerenciamento de usuários
├── roles/             # Papéis e permissões (RBAC)
├── config/            # Configurações do serviço
├── database/          # DataSource e entidades base
├── migrations/        # Migrations isoladas (schema: auth)
├── health/            # Health checks
├── app.module.ts      # Módulo principal
├── main.ts            # Bootstrap da aplicação
└── data-source.ts     # TypeORM DataSource
```

### Entidades

- **User**: Usuários do sistema
- **Role**: Papéis (admin, driver, manager, etc)
- **Permission**: Permissões granulares
- **UserRole**: Relacionamento User ↔ Role
- **RefreshToken**: Tokens de refresh (Redis)

### Database

**Schema isolado**: `auth` (PostgreSQL)

```sql
CREATE SCHEMA IF NOT EXISTS auth;
```

**Migrations**: Isoladas do monolito, numeração própria (0001, 0002, etc)

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 16
- Redis >= 7
- pnpm (recomendado)

### 1. Instalar dependências

```bash
cd packages/auth-service
pnpm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Criar schema no PostgreSQL

```sql
-- Conectar no banco nexustransit_dev
CREATE SCHEMA IF NOT EXISTS auth;
```

### 4. Rodar migrations

```bash
pnpm migration:run
```

### 5. Iniciar serviço

```bash
# Desenvolvimento (hot reload)
pnpm start:dev

# Produção
pnpm build
pnpm start:prod
```

O serviço estará disponível em: `http://localhost:3002`

---

## 📡 API Endpoints

### Autenticação

```bash
# Login
POST /auth/login
Body: { "email": "admin@nexustransit.com", "password": "Admin@123" }

# Refresh Token
POST /auth/refresh
Body: { "refresh_token": "..." }

# Logout
POST /auth/logout
Headers: { "Authorization": "Bearer <token>" }

# Perfil do usuário autenticado
GET /auth/me
Headers: { "Authorization": "Bearer <token>" }
```

### Usuários (RBAC)

```bash
# Listar usuários
GET /users

# Criar usuário
POST /users
Body: { "name": "...", "email": "...", "password": "..." }

# Obter usuário por ID
GET /users/:id

# Atualizar usuário
PATCH /users/:id

# Deletar usuário
DELETE /users/:id
```

### Papéis (RBAC)

```bash
# Listar papéis
GET /roles

# Criar papel
POST /roles

# Obter papel por ID
GET /roles/:id

# Atribuir papel a usuário
POST /users/:userId/roles/:roleId
```

### Health Check

```bash
GET /health
```

---

## 🧪 Testes

### Testes de Contrato (OpenAPI)

Validam que o código implementa corretamente a especificação OpenAPI:

```bash
pnpm test:contract
```

### Testes de Integração

Testam fluxos completos de autenticação:

```bash
pnpm test:integration
```

### Todos os testes

```bash
pnpm test
```

### Coverage

```bash
pnpm test:cov
```

---

## 📝 Contrato OpenAPI

A especificação completa está em: `openapi.yaml`

**Versão**: 1.0.0  
**Formato**: OpenAPI 3.1.0

Acesse a documentação interativa (Swagger UI):
```
http://localhost:3002/api/docs
```

---

## 🐳 Docker

### Build da imagem

```bash
docker build -t nexus-auth-service:latest .
```

### Rodar com Docker Compose

```bash
# No root do projeto
docker-compose up auth-service
```

---

## 📊 Migrations

### Criar nova migration

```bash
pnpm migration:create src/migrations/NomeDaMigration
```

### Gerar migration automática

```bash
pnpm migration:generate src/migrations/NomeDaMigration
```

### Aplicar migrations

```bash
pnpm migration:run
```

### Reverter última migration

```bash
pnpm migration:revert
```

### Ver migrations aplicadas

```bash
pnpm migration:show
```

**Importante**: Todas migrations usam schema `auth`

---

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do serviço | `3002` |
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_SCHEMA` | Schema isolado | `auth` |
| `JWT_SECRET` | Chave secreta JWT | - |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Expiração access token | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Expiração refresh token | `7d` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `THROTTLE_LIMIT` | Rate limit (req/min) | `10` |

Veja `.env.example` para lista completa.

---

## 🎯 Status do Projeto

- ✅ Estrutura básica criada
- ⏳ Código dos módulos sendo copiado
- ⏳ OpenAPI spec em desenvolvimento
- ⏳ Migrations sendo adaptadas
- ⏳ Testes de contrato em desenvolvimento
- ⏳ Dockerfile em desenvolvimento

---

## 📚 Documentação Relacionada

- [Plano de Migração Completo](../../docs/microservices-migration-plan.md)
- [OpenAPI Specification](./openapi.yaml)
- [Arquitetura do Monolito](../../nexus-backend/README.md)

---

## 🤝 Contribuindo

Este microserviço faz parte do trabalho da disciplina **DSC 2025-2**.

**Convenções**:
- Commits semânticos (feat, fix, docs, etc)
- PRs com testes passando
- Code review obrigatório
- Coverage mínimo: 80%

---

## 📞 Suporte

- **Repositório**: https://github.com/Whiskyrie/NexusTransit
- **Branch**: `modularizar_auth_service`

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2025  
**Equipe**: NexusTransit
