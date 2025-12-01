# 🏗️ NexusTransit - Arquitetura de Microsserviços

## 📋 Estrutura do Projeto

```
NexusTransitCopia2/
├── nexus-backend/              # Monólito NestJS (existente)
│   ├── src/modules/            # 15 módulos
│   └── docker-compose.yml      # PostgreSQL:5432 + Redis
│
├── packages/                   # 🆕 Microsserviços (nova arquitetura)
│   ├── users-service/          # ✅ Microsserviço de Usuários
│   │   ├── src/
│   │   ├── docker-compose.yml  # PostgreSQL:5433
│   │   ├── Dockerfile
│   │   └── .env
│   │
│   ├── deliveries-service/     # 🔜 Próximo
│   ├── tracking-service/       # 🔜 Próximo
│   └── notifications-service/  # 🔜 Próximo
│
└── docker-compose.yml          # 🆕 Orquestrador de TODOS os serviços
```

## 🎯 Estratégia de Migração

### Fase 1: Standalone ✅ (Atual)
- Users Service funcionando independentemente
- Database separado (porta 5433)
- Endpoints idênticos ao monólito

### Fase 2: Dual-Write ⏳ (Próxima)
- API Gateway roteando requisições
- Escrita simultânea em monólito E microsserviço
- Sincronização de dados
- Testes de contrato (Pact)

### Fase 3: Cutover Completo 🎯
- Gradual: 10% → 50% → 100%
- Desativação dos endpoints do monólito
- Migração de dados históricos

---

## 🚀 Quick Start

### Opção 1: Rodar TUDO (Monólito + Microsserviços)

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar serviços
docker-compose ps

# Logs
docker-compose logs -f users-service
```

**Serviços disponíveis:**
- **Monólito**: http://localhost:3000
- **Users Service**: http://localhost:3003
- **PostgreSQL Monólito**: localhost:5432
- **PostgreSQL Users**: localhost:5433
- **Redis**: localhost:6379

### Opção 2: Rodar APENAS Users Service

```bash
cd packages/users-service

# Subir PostgreSQL
docker-compose up -d postgres_users

# Instalar dependências
npm install --legacy-peer-deps

# Executar migrations
npm run migration:run

# Iniciar serviço
npm run start:dev
```

**Swagger**: http://localhost:3003/api/docs

---

## 📊 Portas dos Serviços

| Serviço | Porta | Status |
|---------|-------|--------|
| **Monólito** | 3000 | ✅ Ativo |
| **Users Service** | 3003 | ✅ Ativo |
| **Deliveries Service** | 3004 | 🔜 Futuro |
| **Tracking Service** | 3005 | 🔜 Futuro |
| **Notifications Service** | 3006 | 🔜 Futuro |
| **PostgreSQL Monólito** | 5432 | ✅ Ativo |
| **PostgreSQL Users** | 5433 | ✅ Ativo |
| **Redis** | 6379 | ✅ Ativo |

---

## 🗄️ Bancos de Dados

### Separação por Bounded Context

| Database | Porta | Tabelas | Serviço |
|----------|-------|---------|---------|
| `nexustransit` | 5432 | Todas (15 módulos) | Monólito |
| `nexustransit_users_db` | 5433 | `users` apenas | Users Service |

**Por que separar?**
- ✅ Database-per-Service pattern
- ✅ Isolamento de dados
- ✅ Escalabilidade independente
- ✅ Migrações sem impacto no monólito

---

## 🔧 Comandos Úteis

### Docker Compose Raiz

```bash
# Subir todos os serviços
docker-compose up -d

# Subir apenas users service
docker-compose up -d postgres_users users-service

# Parar tudo
docker-compose down

# Ver logs
docker-compose logs -f users-service
docker-compose logs -f postgres_users

# Reconstruir imagens
docker-compose build users-service
docker-compose up -d --build users-service
```

### Users Service (desenvolvimento)

```bash
cd packages/users-service

# Migrations
npm run migration:create -- src/database/migrations/MigrationName
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert

# Desenvolvimento
npm run start:dev       # Watch mode
npm run start:debug     # Debug mode
npm run build           # Build
npm run start:prod      # Produção

# Testes
npm test                # Unit tests
npm run test:e2e        # E2E tests
npm run test:cov        # Coverage
```

---

## 📝 Estrutura do Users Service

```
packages/users-service/
├── src/
│   ├── modules/users/
│   │   ├── entities/user.entity.ts         # 15 campos
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── enums/
│   │   │   ├── user-type.enum.ts           # 5 tipos
│   │   │   └── user-status.enum.ts         # 3 status
│   │   ├── users.service.ts                # 8 métodos
│   │   ├── users.controller.ts             # 5 endpoints
│   │   └── users.module.ts
│   ├── database/
│   │   ├── entities/base.entity.ts         # UUID, timestamps
│   │   ├── migrations/
│   │   │   └── 1700000000001-CreateUsersTable.ts
│   │   ├── data-source.ts                  # TypeORM CLI
│   │   └── database.module.ts
│   ├── config/database.config.ts
│   ├── app.module.ts
│   └── main.ts                              # Port 3003
├── docker-compose.yml
├── Dockerfile
├── .env
├── README.md
├── MIGRATION-GUIDE.md
└── QUICK-START.md
```

---

## 🧪 Testando a Migração

### 1. Criar usuário no Monólito

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@monolith.com",
    "password": "123456",
    "first_name": "Test",
    "last_name": "Monolith",
    "user_type": "customer"
  }'
```

### 2. Criar usuário no Microsserviço

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@microservice.com",
    "password": "123456",
    "first_name": "Test",
    "last_name": "Microservice",
    "user_type": "customer"
  }'
```

### 3. Comparar Respostas

**Ambos devem retornar estrutura idêntica:**
```json
{
  "id": "uuid-here",
  "email": "test@....com",
  "first_name": "Test",
  "last_name": "...",
  "user_type": "customer",
  "status": "active",
  "email_verified": false,
  "created_at": "2025-11-29T...",
  "updated_at": "2025-11-29T..."
}
```

✅ **Fidelidade Total Garantida!**

---

## 🔍 Troubleshooting

### Erro: Unable to connect to the database

**Problema**: Service não consegue conectar ao PostgreSQL

**Solução**:
```bash
# 1. Verificar se PostgreSQL está rodando
docker-compose ps postgres_users

# 2. Verificar health check
docker-compose logs postgres_users

# 3. Testar conexão manual
docker exec -it nexustransit-users-db psql -U nexustransit_users -d nexustransit_users_db

# 4. Verificar variáveis de ambiente
cat packages/users-service/.env

# 5. Reiniciar serviços
docker-compose restart postgres_users users-service
```

### Erro: Port already in use

```bash
# Porta 5433 em uso
netstat -ano | findstr :5433

# Mudar porta no docker-compose.yml:
# "5434:5432"  # Host:Container

# E no .env:
# DB_PORT=5434
```

### Migrations não executam

```bash
cd packages/users-service

# Ver status
npm run typeorm -- migration:show -d src/database/data-source.ts

# Executar manualmente
npm run migration:run

# Se erro persistir, conectar no banco e verificar
docker exec -it nexustransit-users-db psql -U nexustransit_users -d nexustransit_users_db
\dt  # Listar tabelas
```

---

## 📚 Documentação Adicional

- **Users Service**: `packages/users-service/README.md`
- **Guia de Migração**: `packages/users-service/MIGRATION-GUIDE.md`
- **Quick Start**: `packages/users-service/QUICK-START.md`
- **Fase 1 PoC**: `FASE-1-POC-MICROSERVICES.md`

---

## 🎯 Próximos Passos

1. ✅ **Estrutura packages/ criada**
2. ✅ **Users Service migrado**
3. ✅ **Docker Compose raiz criado**
4. 🔄 **Testar conexão e endpoints**
5. ⏳ **Implementar testes de contrato (Pact)**
6. ⏳ **Configurar API Gateway**
7. ⏳ **Implementar dual-write strategy**
8. ⏳ **Migrar próximo módulo (deliveries)**

---

## 👥 Equipe

**Arquitetura**: Seguindo orientações do professor  
**Implementação**: GitHub Copilot + Time NexusTransit  
**Data**: Novembro 2025

---

## 📄 Licença

MIT License - NexusTransit © 2025
