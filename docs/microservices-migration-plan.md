# Plano de Migração Gradual para Microserviços - NexusTransit

## 📋 Visão Geral

Documento de planejamento para migração incremental do monolito NexusTransit para arquitetura de microserviços, seguindo padrões educacionais da disciplina DSC 2025-2.

**Objetivo**: Demonstrar migração gradual usando Strangler Fig Pattern, mantendo estabilidade e permitindo rollback em qualquer etapa.

---

## 🎯 Contexto Atual

### Monolito Existente

```
nexus-backend/
├── src/
│   ├── modules/
│   │   ├── auth/          → Autenticação JWT, guards, strategies
│   │   ├── users/         → Gerenciamento de usuários
│   │   ├── roles/         → Papéis e permissões (RBAC)
│   │   ├── vehicles/      → Gestão de veículos e manutenção
│   │   ├── drivers/       → Motoristas, CNH, documentos
│   │   ├── routes/        → Rotas logísticas
│   │   ├── deliveries/    → Entregas e tracking
│   │   ├── customers/     → Clientes e endereços
│   │   ├── incidents/     → Gestão de incidentes
│   │   ├── audit/         → Logs de auditoria
│   │   ├── lgpd/          → Conformidade LGPD
│   │   ├── tracking/      → Rastreamento em tempo real
│   │   ├── reports/       → Relatórios e analytics
│   │   ├── redis/         → Cache e sessões
│   │   └── upload/        → Gestão de arquivos S3
│   ├── database/
│   │   ├── entities/      → Entidades base
│   │   └── migrations/    → 109 migrations
│   ├── common/
│   │   ├── dto/           → DTOs compartilhados
│   │   ├── transformers/  → Transformers customizados
│   │   └── enums/         → Enums globais
│   └── config/            → Configurações centralizadas
```

### Pontos Fortes do Monolito

- ✅ **Arquitetura bem estruturada**: Módulos bem definidos com responsabilidades claras
- ✅ **Clean Architecture**: DTOs, services, controllers, validators, subscribers
- ✅ **Auditoria robusta**: Sistema completo com `@Auditable` decorator
- ✅ **Documentação Swagger**: Endpoints documentados com OpenAPI
- ✅ **TypeORM bem configurado**: Migrations versionadas, soft delete, relationships
- ✅ **Validações consistentes**: class-validator em todos DTOs
- ✅ **Testes E2E prontos**: Infraestrutura de testes estabelecida

### Pontos a Melhorar

- ⚠️ **Acoplamento de dados**: Todas entidades no mesmo banco
- ⚠️ **Deploy monolítico**: Uma mudança em routes afeta todo sistema
- ⚠️ **Escalabilidade limitada**: Não é possível escalar tracking sem escalar tudo
- ⚠️ **Complexidade crescente**: 109 migrations, múltiplas dependências cruzadas
- ⚠️ **Risco de deploy**: Falha em uma feature compromete sistema inteiro

---

## 🎓 Objetivos Pedagógicos

### Para a Disciplina

1. **Demonstrar migração incremental**: Strangler Fig Pattern na prática
2. **Contract-First Development**: OpenAPI como contrato entre serviços
3. **Database-per-Service**: Isolamento de dados com schemas PostgreSQL
4. **Monorepo com workspaces**: Gerenciar múltiplos packages com pnpm
5. **Testes de contrato**: Validar compatibilidade entre versões
6. **CI/CD por serviço**: Pipelines independentes

### Critérios de Sucesso

- [ ] Cada microserviço pode ser deployado independentemente
- [ ] Contratos OpenAPI versionados e validados
- [ ] Migrations isoladas por serviço
- [ ] Testes de contrato automatizados
- [ ] Rollback possível em qualquer etapa
- [ ] Monolito continua funcionando durante toda migração

---

## 📊 Análise de Bounded Contexts

### Contextos Identificados

#### 1. **Authentication Context** (auth, users, roles)
- **Responsabilidade**: Autenticação, autorização, gestão de identidade
- **Entidades**: User, Role, Permission, RefreshToken
- **APIs**: login, refresh, logout, perfil, RBAC
- **Dependências**: Redis (tokens), Audit (logs)
- **Complexidade**: 🟢 Baixa - Bem isolado

#### 2. **Operations Context** (vehicles, drivers, routes, deliveries)
- **Responsabilidade**: Operações logísticas core
- **Entidades**: Vehicle, Driver, Route, Delivery
- **APIs**: CRUD de recursos operacionais, scheduling
- **Dependências**: Customers, Tracking, Incidents
- **Complexidade**: 🔴 Alta - Fortemente acoplado

#### 3. **Customer Relationship Context** (customers)
- **Responsabilidade**: Gestão de relacionamento com clientes
- **Entidades**: Customer, CustomerAddress, CustomerContact, CustomerPreferences
- **APIs**: CRUD de clientes, endereços, preferências
- **Dependências**: Routes (endereços), Deliveries
- **Complexidade**: 🟡 Média - Relacionamentos com Operations

#### 4. **Monitoring Context** (tracking, incidents, audit, reports)
- **Responsabilidade**: Observabilidade e analytics
- **Entidades**: AuditLog, Incident, TrackingEvent
- **APIs**: Logs, métricas, relatórios, rastreamento
- **Dependências**: Todos os outros contextos (leitura)
- **Complexidade**: 🟡 Média - Read-heavy

#### 5. **Compliance Context** (lgpd, upload)
- **Responsabilidade**: Conformidade regulatória e storage
- **Entidades**: UserConsent, DataRequest, File
- **APIs**: LGPD requests, file upload/download
- **Dependências**: Users (consentimentos), S3
- **Complexidade**: 🟢 Baixa - Isolado

---

## 🔄 Estratégia de Migração (Strangler Fig Pattern)

### Princípios

1. **Migração incremental**: Um serviço por vez
2. **Testes em paralelo**: Monolito e microserviço coexistem
3. **Feature flags**: Controle de tráfego gradual
4. **Contract-first**: OpenAPI define contrato antes de código
5. **Database per service**: Schema isolado no mesmo PostgreSQL (lab)
6. **Backward compatibility**: Monolito continua funcionando

### Fases

```
Semana 1-2:  Setup de monorepo + @nexus/common
Semana 3-4:  Auth Service (extração + validação)
Semana 5-6:  Customers Service
Semana 7-8:  Monitoring Service (audit + tracking)
Semana 9-10: Operations Service (routes + deliveries)
```

---

## 🏗️ Arquitetura Alvo

### Estrutura de Monorepo

```
NexusTransit/
├── packages/
│   ├── common/                    # @nexus/common
│   │   ├── src/
│   │   │   ├── dto/               # DTOs compartilhados
│   │   │   ├── enums/             # Enums globais
│   │   │   ├── interfaces/        # Interfaces TypeScript
│   │   │   ├── transformers/      # Transformers customizados
│   │   │   ├── decorators/        # Decorators (@Auditable, etc)
│   │   │   ├── guards/            # Guards compartilhados
│   │   │   ├── interceptors/      # Interceptors base
│   │   │   ├── validators/        # Validadores customizados (CPF, CNH, etc)
│   │   │   └── utils/             # Utilities gerais
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth-service/              # Microserviço de Autenticação
│   │   ├── src/
│   │   │   ├── auth/              # Copiado de monolito
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── migrations/        # Migrations isoladas (schema: auth)
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   └── data-source.ts     # DataSource específico
│   │   ├── test/
│   │   │   ├── contract/          # Testes de contrato OpenAPI
│   │   │   └── integration/       # Testes de integração
│   │   ├── openapi.yaml           # Contrato OpenAPI 3.1
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── customers-service/         # Microserviço de Clientes
│   │   ├── src/
│   │   │   ├── customers/
│   │   │   ├── migrations/        # schema: customers
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   └── data-source.ts
│   │   ├── test/
│   │   ├── openapi.yaml
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── operations-service/        # Routes, Deliveries, Vehicles, Drivers
│   │   └── ... (estrutura similar)
│   │
│   ├── monitoring-service/        # Audit, Tracking, Reports, Incidents
│   │   └── ... (estrutura similar)
│   │
│   └── compliance-service/        # LGPD, Upload
│       └── ... (estrutura similar)
│
├── monolith/                      # Monolito original (renomeado)
│   └── nexus-backend/
│       └── ... (código atual)
│
├── scripts/
│   ├── bootstrap-db.sh            # Setup schemas PostgreSQL
│   └── run-migrations.sh          # Rodar migrations de todos serviços
│
├── docker-compose.yml             # Orquestração local
├── pnpm-workspace.yaml            # Workspace config
├── package.json                   # Root package
└── README.md
```

### Database: Multi-Schema PostgreSQL

```sql
-- Database: nexustransit_dev (único banco físico)

-- Schemas por serviço (isolamento lógico)
CREATE SCHEMA IF NOT EXISTS auth;        -- auth-service
CREATE SCHEMA IF NOT EXISTS customers;   -- customers-service
CREATE SCHEMA IF NOT EXISTS operations;  -- operations-service
CREATE SCHEMA IF NOT EXISTS monitoring;  -- monitoring-service
CREATE SCHEMA IF NOT EXISTS compliance;  -- compliance-service

-- Extensões globais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;
```

**Vantagens para Lab/Ensino:**
- ✅ Única instância PostgreSQL (reduz complexidade infra)
- ✅ Isolamento lógico via schemas
- ✅ Migrations isoladas por serviço
- ✅ Transações cross-schema se necessário (fallback)
- ✅ Facilita demonstrações e experimentos

---

## 📦 Package: @nexus/common

### Responsabilidades

Biblioteca compartilhada com código reutilizável entre microserviços, **sem** lógica de negócio.

### Estrutura

```typescript
// packages/common/src/index.ts
export * from './dto';
export * from './enums';
export * from './interfaces';
export * from './transformers';
export * from './decorators';
export * from './guards';
export * from './validators';
export * from './utils';
```

### Conteúdo a Extrair do Monolito

#### DTOs Compartilhados
```typescript
// packages/common/src/dto/
├── base-filter.dto.ts           // Paginação, busca, ordenação
├── paginated-response.dto.ts    // Resposta paginada padrão
├── error-response.dto.ts        // Erros padronizados
└── health-response.dto.ts       // Health checks
```

#### Enums Globais
```typescript
// packages/common/src/enums/
├── audit-action.enum.ts
├── audit-category.enum.ts
├── user-status.enum.ts
└── common.enum.ts
```

#### Transformers
```typescript
// packages/common/src/transformers/
└── point.transformer.ts         // Coordenadas geográficas
```

#### Decorators
```typescript
// packages/common/src/decorators/
├── auditable.decorator.ts       // @Auditable para entidades
└── public-route.decorator.ts    // @Public para rotas sem auth
```

#### Validators
```typescript
// packages/common/src/validators/
├── cpf.validator.ts
├── cnh.validator.ts
├── license-plate.validator.ts
└── mopp.validator.ts
```

#### Guards Compartilhados
```typescript
// packages/common/src/guards/
├── jwt-auth.guard.ts            // Validação JWT
└── roles.guard.ts               // RBAC check
```

### package.json

```json
{
  "name": "@nexus/common",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --fix"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/swagger": "^11.2.0",
    "class-validator": "^0.14.2",
    "class-transformer": "^0.5.1",
    "typeorm": "^0.3.26"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.6.0",
    "jest": "^29.0.0"
  }
}
```

---

## 🔐 Primeiro Microserviço: auth-service

### Por que Auth primeiro?

1. **Bem isolado**: Poucas dependências externas
2. **Crítico**: Necessário para validar outros serviços
3. **Educacional**: Demonstra padrão completo de extração
4. **Tamanho ideal**: Não muito pequeno, não muito grande

### Escopo

**Módulos do Monolito:**
- `auth/` → Autenticação, login, refresh, logout
- `users/` → CRUD de usuários
- `roles/` → Papéis e permissões (RBAC)
- `redis/` → Cache e token blacklist

**Entidades:**
- User
- Role
- Permission
- UserRole (join table)
- RefreshToken (Redis)

**APIs:**
- `POST /auth/login` - Autenticar usuário
- `POST /auth/refresh` - Renovar access token
- `POST /auth/logout` - Invalidar tokens
- `GET /auth/me` - Perfil do usuário autenticado
- `GET /users` - Listar usuários (RBAC)
- `POST /users` - Criar usuário
- `GET /roles` - Listar papéis
- `POST /roles` - Criar papel

### Contrato OpenAPI (auth-service/openapi.yaml)

```yaml
openapi: 3.1.0
info:
  title: NexusTransit Auth Service
  version: 1.0.0
  description: Serviço de autenticação e gerenciamento de usuários

servers:
  - url: http://localhost:3002
    description: Development

paths:
  /auth/login:
    post:
      summary: Autenticar usuário
      operationId: login
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginDto'
      responses:
        '200':
          description: Login bem-sucedido
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Credenciais inválidas
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/refresh:
    post:
      summary: Renovar access token
      operationId: refreshToken
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefreshTokenDto'
      responses:
        '200':
          description: Token renovado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Refresh token inválido
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/me:
    get:
      summary: Obter perfil do usuário autenticado
      operationId: getProfile
      tags:
        - Authentication
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Perfil retornado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'

  /health:
    get:
      summary: Health check
      operationId: healthCheck
      tags:
        - Health
      responses:
        '200':
          description: Serviço saudável
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok

components:
  schemas:
    LoginDto:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: admin@nexustransit.com
        password:
          type: string
          minLength: 6
          example: Senha@123

    RefreshTokenDto:
      type: object
      required:
        - refresh_token
      properties:
        refresh_token:
          type: string
          example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

    LoginResponse:
      type: object
      properties:
        access_token:
          type: string
        refresh_token:
          type: string
        token_type:
          type: string
          default: Bearer
        expires_in:
          type: number
          example: 900
        user:
          $ref: '#/components/schemas/UserResponse'

    UserResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        is_active:
          type: boolean
        roles:
          type: array
          items:
            type: string

    ErrorResponse:
      type: object
      properties:
        statusCode:
          type: number
        message:
          type: string
        error:
          type: string

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### Migrations Isoladas

**Estratégia:**
1. Copiar migrations relevantes do monolito
2. Adaptar para schema `auth`
3. Renumerar sequencialmente

```typescript
// packages/auth-service/src/migrations/0001-CreateUsersTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable0001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Garantir schema existe
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);
    
    // Criar tabela no schema auth
    await queryRunner.query(`
      CREATE TABLE auth.users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email CITEXT UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth.users CASCADE`);
  }
}
```

### DataSource Isolado

```typescript
// packages/auth-service/src/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AuthDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nexustransit_dev',
  
  // IMPORTANTE: Schema isolado
  schema: 'auth',
  
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  
  synchronize: false,
  migrationsRun: true,
  logging: process.env.DB_LOGGING === 'true',
  
  // Permitir acesso a public schema para extensões
  extra: { 
    options: `-c search_path=auth,public` 
  },
});
```

### Testes de Contrato

```typescript
// packages/auth-service/test/contract/openapi.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

describe('OpenAPI Contract Tests', () => {
  let app: INestApplication;
  let openApiSpec: any;

  beforeAll(async () => {
    // Carregar spec OpenAPI
    const specPath = path.join(__dirname, '../../openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = yaml.load(specContent);

    // Criar app de teste
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Endpoints existem conforme OpenAPI', () => {
    it('POST /auth/login deve existir', () => {
      expect(openApiSpec.paths['/auth/login'].post).toBeDefined();
    });

    it('POST /auth/refresh deve existir', () => {
      expect(openApiSpec.paths['/auth/refresh'].post).toBeDefined();
    });

    it('GET /auth/me deve existir', () => {
      expect(openApiSpec.paths['/auth/me'].get).toBeDefined();
    });

    it('GET /health deve existir', () => {
      expect(openApiSpec.paths['/health'].get).toBeDefined();
    });
  });

  describe('Schemas estão definidos', () => {
    it('LoginDto schema existe', () => {
      expect(openApiSpec.components.schemas.LoginDto).toBeDefined();
    });

    it('LoginResponse schema existe', () => {
      expect(openApiSpec.components.schemas.LoginResponse).toBeDefined();
    });

    it('UserResponse schema existe', () => {
      expect(openApiSpec.components.schemas.UserResponse).toBeDefined();
    });
  });

  describe('Endpoints respondem (smoke test)', () => {
    it('GET /health retorna 200', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });

    it('POST /auth/login com credenciais inválidas retorna 401', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrong' })
        .expect(401);
    });
  });
});
```

### Testes de Integração

```typescript
// packages/auth-service/test/integration/auth.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Fluxo de autenticação completo', () => {
    it('Deve fazer login com credenciais válidas', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@nexustransit.com',
          password: 'Admin@123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@nexustransit.com');

      accessToken = response.body.access_token;
    });

    it('Deve obter perfil com token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe('admin@nexustransit.com');
    });

    it('Deve rejeitar token inválido', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('Deve renovar token com refresh válido', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@nexustransit.com',
          password: 'Admin@123',
        });

      const refreshToken = loginResponse.body.refresh_token;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('access_token');
      expect(refreshResponse.body.access_token).not.toBe(accessToken);
    });
  });

  describe('Validações de entrada', () => {
    it('Deve rejeitar email inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Test@123',
        })
        .expect(400);
    });

    it('Deve rejeitar senha vazia', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        })
        .expect(400);
    });
  });
});
```

---

## 🚀 Plano de Execução (Passo a Passo)

### Fase 0: Setup de Monorepo (Semana 1-2)

#### Checklist

- [ ] Configurar pnpm workspace
- [ ] Criar estrutura de `packages/`
- [ ] Mover monolito para `monolith/nexus-backend/`
- [ ] Criar `packages/common/` com código compartilhado
- [ ] Configurar TypeScript paths
- [ ] Configurar ESLint e Prettier no root
- [ ] Criar scripts de build e test no root
- [ ] Documentar estrutura no README.md

#### Comandos

```bash
# 1. Instalar pnpm globalmente
npm install -g pnpm

# 2. Inicializar workspace
cd NexusTransit
pnpm init

# 3. Criar pnpm-workspace.yaml
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
  - 'monolith/nexus-backend'
EOF

# 4. Criar estrutura de packages
mkdir -p packages/common/src/{dto,enums,interfaces,transformers,decorators,validators,guards,utils}

# 5. Mover monolito (backup primeiro!)
mkdir monolith
mv nexus-backend monolith/

# 6. Criar package.json no common
cd packages/common
pnpm init
pnpm add @nestjs/common @nestjs/swagger class-validator class-transformer typeorm
pnpm add -D typescript @types/node

# 7. Configurar TypeScript no common
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 8. Voltar ao root e instalar dependências
cd ../..
pnpm install
```

### Fase 1: Extração do Auth Service (Semana 3-4)

#### Checklist

- [ ] Criar scaffold de `packages/auth-service/`
- [ ] Copiar módulos auth, users, roles do monolito
- [ ] Criar openapi.yaml com contrato completo
- [ ] Adaptar imports para usar `@nexus/common`
- [ ] Configurar DataSource com schema `auth`
- [ ] Copiar e adaptar migrations relevantes
- [ ] Implementar testes de contrato
- [ ] Implementar testes de integração
- [ ] Criar Dockerfile
- [ ] Adicionar ao docker-compose.yml
- [ ] Documentar README.md do serviço
- [ ] Validar funcionamento local

#### Comandos

```bash
# 1. Criar estrutura auth-service
mkdir -p packages/auth-service/{src,test/{contract,integration}}

# 2. Copiar código do monolito
cp -r monolith/nexus-backend/src/modules/auth packages/auth-service/src/
cp -r monolith/nexus-backend/src/modules/users packages/auth-service/src/
cp -r monolith/nexus-backend/src/modules/roles packages/auth-service/src/

# 3. Criar package.json
cd packages/auth-service
pnpm init
pnpm add @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/typeorm \
         @nestjs/jwt @nestjs/passport @nestjs/config @nestjs/swagger \
         typeorm pg passport passport-jwt bcrypt redis keyv @keyv/redis \
         class-validator class-transformer
pnpm add -D @nestjs/cli @nestjs/testing @types/node @types/passport-jwt \
            jest supertest ts-node typescript

# 4. Adicionar @nexus/common
pnpm add @nexus/common@workspace:*

# 5. Criar openapi.yaml (usar template acima)
touch openapi.yaml

# 6. Criar data-source.ts (usar template acima)
touch src/data-source.ts

# 7. Criar migrations isoladas
mkdir -p src/migrations
# Copiar e adaptar migrations 1, 2, 4 do monolito

# 8. Criar testes de contrato
touch test/contract/openapi.spec.ts

# 9. Criar testes de integração
touch test/integration/auth.integration.spec.ts

# 10. Criar Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/common ../common
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3002
CMD ["node", "dist/main.js"]
EOF

# 11. Rodar testes
pnpm test:contract
pnpm test:integration

# 12. Rodar serviço local
pnpm start:dev
```

#### Validação

```bash
# Health check
curl http://localhost:3002/health

# Login
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexustransit.com","password":"Admin@123"}'

# Me
TOKEN="<access_token_do_login>"
curl http://localhost:3002/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Fase 2: Integração com Monolito (Semana 5)

#### Estratégias de Coexistência

##### Opção 1: API Gateway (Nginx)

```nginx
# nginx.conf
upstream monolith {
    server localhost:3000;
}

upstream auth_service {
    server localhost:3002;
}

server {
    listen 8080;
    
    # Rotear /auth para microserviço
    location /auth {
        proxy_pass http://auth_service;
    }
    
    # Rotear resto para monolito
    location / {
        proxy_pass http://monolith;
    }
}
```

##### Opção 2: Feature Flag no Monolito

```typescript
// monolith/nexus-backend/src/modules/auth/auth.controller.ts
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const useNewService = this.configService.get<boolean>('USE_AUTH_SERVICE');
    
    if (useNewService) {
      // Delegar para microserviço
      const response = await axios.post(
        'http://localhost:3002/auth/login',
        loginDto,
      );
      return response.data;
    }
    
    // Código original do monolito
    return this.authService.login(loginDto);
  }
}
```

##### Opção 3: Canary Deployment (Gradual)

```yaml
# docker-compose.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx-canary.conf:/etc/nginx/nginx.conf
    depends_on:
      - monolith
      - auth-service

  monolith:
    build: ./monolith/nexus-backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis

  auth-service:
    build: ./packages/auth-service
    ports:
      - "3002:3002"
    environment:
      - DB_HOST=postgres
      - DB_SCHEMA=auth
      - REDIS_HOST=redis

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    volumes:
      - ./scripts/init-schemas.sql:/docker-entrypoint-initdb.d/01-schemas.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

```nginx
# nginx-canary.conf
upstream monolith {
    server monolith:3000;
}

upstream auth_service {
    server auth-service:3002;
}

split_clients "${remote_addr}${http_user_agent}" $auth_backend {
    10%     auth_service;  # 10% para microserviço
    *       monolith;       # 90% para monolito
}

server {
    listen 80;
    
    location /auth {
        proxy_pass http://$auth_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://monolith;
    }
}
```

### Fase 3: Monitoramento e Validação (Semana 6)

#### Métricas a Monitorar

```yaml
# packages/auth-service/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3002']
  
  - job_name: 'monolith'
    static_configs:
      - targets: ['monolith:3000']
```

#### Dashboard Grafana

- **Latência**: P50, P95, P99 de cada endpoint
- **Taxa de erro**: 4xx, 5xx por serviço
- **Throughput**: Requests/segundo
- **Database**: Connection pool, query time
- **Redis**: Hit rate, latência

#### Logs Estruturados

```typescript
// packages/auth-service/src/main.ts
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  const logger = new Logger('AuthService');
  
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.log({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        service: 'auth-service',
      });
    });
    next();
  });
  
  await app.listen(3002);
  logger.log('Auth Service running on http://localhost:3002');
}
bootstrap();
```

### Fase 4: Cutover Gradual (Semana 7-8)

#### Plano de Cutover

```
Dia 1:   10% tráfego → auth-service (monitorar 24h)
Dia 2:   25% tráfego → auth-service (monitorar 24h)
Dia 3:   50% tráfego → auth-service (monitorar 24h)
Dia 4:   75% tráfego → auth-service (monitorar 24h)
Dia 5:  100% tráfego → auth-service (monitorar 48h)
Dia 7:   Remover código auth do monolito
```

#### Critérios de Rollback

- **Latência P95 > 500ms**: Rollback imediato
- **Taxa de erro > 1%**: Rollback imediato
- **Falha de auth crítica**: Rollback imediato
- **Database connection issues**: Rollback imediato

#### Procedimento de Rollback

```bash
# 1. Alterar nginx para 0% tráfego no microserviço
# nginx-canary.conf
split_clients "${remote_addr}${http_user_agent}" $auth_backend {
    0%      auth_service;
    *       monolith;
}

# 2. Recarregar nginx
docker-compose exec nginx nginx -s reload

# 3. Validar monolito está respondendo
curl -X POST http://localhost:8080/auth/login \
  -d '{"email":"admin@nexustransit.com","password":"Admin@123"}'

# 4. Investigar causa raiz no auth-service
docker-compose logs auth-service

# 5. Aplicar correção e revalidar
```

---

## 📝 Exercícios para Alunos

### Exercício 1: Setup de Monorepo (Individual)

**Objetivo**: Configurar estrutura básica de monorepo com pnpm workspaces.

**Tarefas**:
1. Criar `pnpm-workspace.yaml`
2. Inicializar `packages/common/`
3. Mover monolito para `monolith/`
4. Extrair 3 DTOs para `@nexus/common`
5. Configurar imports no monolito para usar `@nexus/common`

**Entrega**: Pull Request com estrutura configurada + README.md explicando setup.

**Critérios de Avaliação**:
- Estrutura de diretórios correta (20%)
- pnpm-workspace.yaml funcional (20%)
- @nexus/common compilável (20%)
- Imports atualizados no monolito (20%)
- README.md claro e completo (20%)

### Exercício 2: Contrato OpenAPI (Dupla)

**Objetivo**: Criar especificação OpenAPI completa para um módulo.

**Tarefas**:
1. Escolher módulo (customers, vehicles, routes, etc)
2. Mapear todos endpoints do módulo
3. Documentar request/response schemas
4. Adicionar exemplos realistas
5. Validar spec com ferramenta online

**Entrega**: Arquivo `openapi.yaml` + documento explicando decisões de design.

**Critérios de Avaliação**:
- Especificação válida OpenAPI 3.1 (25%)
- Todos endpoints documentados (25%)
- Schemas completos com validações (25%)
- Exemplos realistas (15%)
- Documentação de design decisions (10%)

### Exercício 3: Extração de Microserviço (Grupo de 3)

**Objetivo**: Extrair módulo do monolito para microserviço completo.

**Tarefas**:
1. Criar scaffold do serviço
2. Copiar código do monolito
3. Adaptar imports para `@nexus/common`
4. Criar DataSource com schema isolado
5. Migrar migrations relevantes
6. Implementar testes de contrato
7. Implementar testes de integração
8. Dockerizar serviço
9. Adicionar ao docker-compose
10. Validar funcionamento

**Entrega**: 
- Pull Request com microserviço completo
- Relatório técnico (arquitetura, decisões, desafios)
- Demo em vídeo (5min)

**Critérios de Avaliação**:
- Código funcional e bem estruturado (30%)
- Testes de contrato passando (20%)
- Testes de integração passando (20%)
- Dockerfile otimizado (10%)
- Relatório técnico completo (15%)
- Qualidade da demo (5%)

### Exercício 4: Estratégia de Coexistência (Individual)

**Objetivo**: Implementar feature flag ou API gateway para gradual rollout.

**Tarefas**:
1. Escolher estratégia (feature flag, nginx, canary)
2. Implementar solução
3. Configurar métricas e logs
4. Testar cenários de falha
5. Documentar procedimento de rollback

**Entrega**: Código + README.md com instruções de uso + análise de trade-offs.

**Critérios de Avaliação**:
- Implementação funcional (35%)
- Métricas e logs adequados (25%)
- Testes de cenários de falha (20%)
- Documentação de rollback (15%)
- Análise de trade-offs (5%)

---

## 🎯 Marcos (Milestones) da Disciplina

### Milestone 1: Monorepo Setup (Semana 2)
- ✅ pnpm workspace configurado
- ✅ @nexus/common criado
- ✅ Monolito refatorado para usar common
- ✅ CI/CD básico funcionando

### Milestone 2: Auth Service (Semana 4)
- ✅ Auth service extraído
- ✅ OpenAPI spec completo
- ✅ Testes de contrato passando
- ✅ Migrations isoladas
- ✅ Dockerizado e funcional

### Milestone 3: Coexistência (Semana 6)
- ✅ API Gateway ou feature flags
- ✅ Monitoramento implementado
- ✅ Canary deployment testado
- ✅ Procedimento de rollback documentado

### Milestone 4: Segundo Serviço (Semana 8)
- ✅ Customers service extraído
- ✅ Comunicação inter-serviço funcionando
- ✅ Event sourcing ou CDC implementado (opcional)
- ✅ Load testing realizado

### Milestone 5: Produção (Semana 10)
- ✅ Pelo menos 2 microserviços em produção
- ✅ Monolito com código reduzido
- ✅ CI/CD por serviço
- ✅ Documentação completa
- ✅ Apresentação final (pitch de 15min)

---

## 📚 Referências e Materiais de Apoio

### Repositório do Professor
- https://github.com/evertonfoz/dsc-2025-2-aurora-platform

### Patterns
- **Strangler Fig Pattern**: https://martinfowler.com/bliki/StranglerFigApplication.html
- **Database per Service**: https://microservices.io/patterns/data/database-per-service.html
- **API Gateway**: https://microservices.io/patterns/apigateway.html
- **Circuit Breaker**: https://martinfowler.com/bliki/CircuitBreaker.html

### Ferramentas
- **pnpm**: https://pnpm.io/workspaces
- **OpenAPI**: https://spec.openapis.org/oas/v3.1.0
- **TypeORM**: https://typeorm.io
- **NestJS**: https://docs.nestjs.com
- **Docker Compose**: https://docs.docker.com/compose

### Livros Recomendados
- "Building Microservices" - Sam Newman
- "Microservices Patterns" - Chris Richardson
- "Domain-Driven Design" - Eric Evans

---

## ⚠️ Riscos e Mitigações

### Risco 1: Dependências Circulares
**Impacto**: Alto  
**Probabilidade**: Média  
**Mitigação**: 
- Usar @nexus/common apenas para código utilitário
- Comunicação entre serviços via HTTP/eventos, nunca imports diretos
- Diagramas de dependências revisados semanalmente

### Risco 2: Inconsistência de Dados
**Impacto**: Alto  
**Probabilidade**: Alta  
**Mitigação**:
- Começar com schemas isolados mas mesmo banco (reduz complexidade)
- Implementar transações distribuídas apenas onde crítico
- Eventual consistency para casos não-críticos
- Migrations testadas em staging antes de produção

### Risco 3: Overhead de Infra
**Impacto**: Médio  
**Probabilidade**: Alta  
**Mitigação**:
- Usar docker-compose localmente
- Um banco PostgreSQL com schemas (não múltiplos bancos)
- Redis compartilhado inicialmente
- Escalar infra apenas quando necessário

### Risco 4: Curva de Aprendizado
**Impacto**: Médio  
**Probabilidade**: Alta  
**Mitigação**:
- Documentação detalhada (este documento)
- Pair programming nas primeiras extrações
- Code reviews rigorosos
- Sessões de dúvidas semanais

### Risco 5: Regressões durante Migração
**Impacto**: Alto  
**Probabilidade**: Média  
**Mitigação**:
- Testes de contrato automatizados
- Testes E2E do monolito sempre rodando
- Canary deployment com rollback rápido
- Feature flags para controle de tráfego

---

## ✅ Checklist Final de Validação

### Para cada microserviço extraído:

- [ ] OpenAPI spec completo e versionado
- [ ] Testes de contrato passando (100% coverage de endpoints)
- [ ] Testes de integração passando (>80% coverage)
- [ ] Migrations isoladas no schema próprio
- [ ] Dockerfile otimizado (multi-stage build)
- [ ] docker-compose.yml atualizado
- [ ] README.md com instruções completas
- [ ] Logs estruturados implementados
- [ ] Métricas Prometheus expostas
- [ ] Health check endpoint funcional
- [ ] CI/CD pipeline configurado
- [ ] Procedimento de rollback documentado
- [ ] Code review aprovado por 2 pessoas
- [ ] Demo funcional gravada

---

## 🚀 Próximos Passos Imediatos

1. **Revisar este plano com a turma** (30min)
2. **Dividir turma em grupos** (3-4 pessoas)
3. **Atribuir microserviços** (auth, customers, operations, monitoring)
4. **Configurar monorepo** (Semana 1)
5. **Criar @nexus/common** (Semana 1-2)
6. **Iniciar extração do auth-service** (Semana 3)

---

**Versão**: 1.0.0  
**Data**: Dezembro 2025  
**Autor**: Equipe NexusTransit  
**Disciplina**: DSC 2025-2
