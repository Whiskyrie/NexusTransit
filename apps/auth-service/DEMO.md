# 🎯 Guia de Demonstração - Auth Service

## 📋 Pré-requisitos

Antes de demonstrar, você precisa ter instalado:

- ✅ Node.js 20+
- ✅ PostgreSQL 16
- ✅ Redis 7 (opcional, mas recomendado)
- ✅ pnpm

## 🚀 Passo 1: Setup do Banco de Dados

### Opção A: PostgreSQL Local

```bash
# Criar database
psql -U postgres -c "CREATE DATABASE nexustransit_dev;"

# Criar schema auth
psql -U postgres -d nexustransit_dev -c "CREATE SCHEMA IF NOT EXISTS auth;"
```

### Opção B: Docker Compose (Recomendado)

Crie um arquivo `docker-compose.dev.yml` na raiz do auth-service:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: auth-postgres
    environment:
      POSTGRES_DB: nexustransit_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: auth-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Iniciar serviços:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 🔧 Passo 2: Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado. Verifique se as credenciais do PostgreSQL estão corretas.

## 📊 Passo 3: Executar Migrations

```bash
cd packages/auth-service

# Rodar migrations
pnpm migration:run
```

**Migrations que serão executadas:**
1. ✅ CreateUsersTable - Tabela `auth.users`
2. ✅ CreateRolesTable - Tabela `auth.roles`
3. ✅ CreateUserRolesTable - Tabela `auth.user_roles`

## 🎬 Passo 4: Iniciar o Serviço

```bash
# Modo desenvolvimento (com hot reload)
pnpm start:dev

# OU modo produção
pnpm build
pnpm start:prod
```

**Saída esperada:**
```
[Nest] 12345  - 02/12/2025, 10:00:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/12/2025, 10:00:00     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 02/12/2025, 10:00:00     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - 02/12/2025, 10:00:01     LOG [InstanceLoader] AuthModule dependencies initialized
🚀 Auth Service running on: http://localhost:3002/api
📚 API Docs: http://localhost:3002/api/docs
```

## 📖 Passo 5: Demonstrar Funcionalidades

### 5.1 - OpenAPI/Swagger UI

Abra no navegador:
```
http://localhost:3002/api/docs
```

**O que mostrar:**
- ✅ 11 endpoints documentados
- ✅ 4 endpoints de Authentication
- ✅ 5 endpoints de Users CRUD
- ✅ 2 endpoints de Roles
- ✅ 1 endpoint de Health
- ✅ 9 schemas (DTOs) definidos
- ✅ Bearer Authentication configurada

### 5.2 - Health Check

```bash
curl http://localhost:3002/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  },
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  }
}
```

### 5.3 - Criar Usuário (POST /api/users)

```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "João",
    "last_name": "Silva",
    "email": "joao.silva@example.com",
    "password": "SenhaSegura123!",
    "user_type": "customer",
    "phone": "+5511999999999"
  }'
```

**Resposta esperada:**
```json
{
  "id": "uuid-gerado",
  "first_name": "João",
  "last_name": "Silva",
  "email": "joao.silva@example.com",
  "user_type": "customer",
  "status": "active",
  "email_verified": false,
  "created_at": "2024-12-02T10:00:00Z",
  "updated_at": "2024-12-02T10:00:00Z"
}
```

### 5.4 - Login (POST /api/auth/login)

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@example.com",
    "password": "SenhaSegura123!"
  }'
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "joao.silva@example.com",
    "first_name": "João",
    "last_name": "Silva"
  }
}
```

### 5.5 - Obter Perfil (GET /api/auth/me)

```bash
# Copie o access_token da resposta anterior
curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "id": "uuid",
  "email": "joao.silva@example.com",
  "first_name": "João",
  "last_name": "Silva",
  "user_type": "customer",
  "status": "active",
  "roles": []
}
```

### 5.6 - Listar Usuários (GET /api/users)

```bash
curl -X GET "http://localhost:3002/api/users?page=1&limit=10" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

### 5.7 - Refresh Token (POST /api/auth/refresh)

```bash
curl -X POST http://localhost:3002/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "SEU_REFRESH_TOKEN_AQUI"
  }'
```

### 5.8 - Logout (POST /api/auth/logout)

```bash
curl -X POST http://localhost:3002/api/auth/logout \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

## 🧪 Passo 6: Executar Testes de Contrato

```bash
pnpm test:contract
```

**Resultado esperado:**
```
 PASS  test/contract/openapi.spec.ts
  OpenAPI Contract Tests
    ✓ 28 testes passando
    ✓ Todos endpoints documentados
    ✓ Todos schemas validados
    ✓ Security schemes configurados

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Time:        3.125 s
```

## 📊 Passo 7: Verificar no Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres -d nexustransit_dev

# Verificar schema
\dn

# Listar tabelas
\dt auth.*

# Ver usuários criados
SELECT id, email, first_name, last_name, user_type, status 
FROM auth.users;

# Ver roles
SELECT * FROM auth.roles;
```

## 🎥 Roteiro de Demonstração para o Professor

### 1. **Mostrar Arquitetura (2 min)**
   - Explicar separação em schema `auth` isolado
   - Mostrar estrutura de diretórios organizada
   - Explicar padrão de módulos do NestJS

### 2. **Executar Migrations (1 min)**
   ```bash
   pnpm migration:run
   ```
   - Mostrar que cria 3 tabelas no schema `auth`

### 3. **Iniciar Serviço (1 min)**
   ```bash
   pnpm start:dev
   ```
   - Mostrar logs de inicialização
   - Destacar porta 3002

### 4. **Swagger UI (3 min)**
   - Abrir http://localhost:3002/api/docs
   - Mostrar 11 endpoints documentados
   - Demonstrar um endpoint pelo Swagger
   - Mostrar schemas e security

### 5. **Testar APIs via cURL/Postman (5 min)**
   - Health Check ✅
   - Criar usuário ✅
   - Login ✅
   - Get Profile com token ✅
   - Listar usuários ✅

### 6. **Mostrar Testes de Contrato (2 min)**
   ```bash
   pnpm test:contract
   ```
   - 28 testes passando ✅

### 7. **Verificar Banco de Dados (2 min)**
   - Conectar ao PostgreSQL
   - Mostrar tabelas criadas no schema `auth`
   - Mostrar dados inseridos

## 🔍 Troubleshooting

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
docker ps
# OU
systemctl status postgresql
```

### Erro: "Port 3002 already in use"
```bash
# Mudar porta no .env
PORT=3003
```

### Erro: "Redis connection failed"
```bash
# Redis é opcional. Se não tiver:
# 1. Comente RedisModule no app.module.ts
# OU
# 2. Inicie Redis:
docker run -d -p 6379:6379 redis:7-alpine
```

## 📝 Checklist de Demonstração

- [ ] PostgreSQL rodando
- [ ] Redis rodando (opcional)
- [ ] Migrations executadas
- [ ] Serviço iniciado (pnpm start:dev)
- [ ] Health check funcionando
- [ ] Swagger UI acessível
- [ ] Pelo menos 1 usuário criado
- [ ] Login funcionando
- [ ] Token JWT válido obtido
- [ ] Endpoint protegido testado
- [ ] Testes de contrato passando

## 🎓 Pontos para Destacar ao Professor

1. ✅ **Isolamento de Schema**: Banco multi-tenant com schema `auth` separado
2. ✅ **Contract-First**: OpenAPI spec completo antes da implementação
3. ✅ **Testes de Contrato**: 28 testes validando especificação
4. ✅ **Clean Architecture**: Separação clara de responsabilidades
5. ✅ **JWT Authentication**: Access + Refresh tokens implementados
6. ✅ **Soft Delete**: Implementado em todas entidades
7. ✅ **Rate Limiting**: Proteção contra abuso
8. ✅ **Audit Trail**: Sistema de auditoria (stub funcional)
9. ✅ **TypeORM Migrations**: Versionamento de schema
10. ✅ **Docker Ready**: Dockerfile e docker-compose prontos

---

**Tempo estimado de demonstração:** 15-20 minutos
**Complexidade:** Demonstração completa de microserviço funcional
**Impacto:** Mostra domínio de NestJS, TypeORM, PostgreSQL, JWT e arquitetura de microserviços
