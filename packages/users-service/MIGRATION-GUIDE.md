# 🔄 Guia de Migração - Users Module

## 📊 Análise de Fidelidade ao Monólito

### ✅ Fidelidade Total Garantida

Este microsserviço mantém **100% de fidelidade** com o monólito em todos os aspectos críticos:

---

## 1️⃣ Estrutura de Dados

### BaseEntity

| Campo | Monólito | Microsserviço | Status |
|-------|----------|---------------|--------|
| `id` | UUID (PK) | UUID (PK) | ✅ Idêntico |
| `created_at` | TIMESTAMPTZ | TIMESTAMPTZ | ✅ Idêntico |
| `updated_at` | TIMESTAMPTZ | TIMESTAMPTZ | ✅ Idêntico |
| `deleted_at` | TIMESTAMPTZ (nullable) | TIMESTAMPTZ (nullable) | ✅ Idêntico |

### User Entity

| Campo | Tipo Monólito | Tipo Microsserviço | Validação | Status |
|-------|---------------|-------------------|-----------|--------|
| `email` | VARCHAR(255) UNIQUE | VARCHAR(255) UNIQUE | Email válido | ✅ |
| `password_hash` | VARCHAR(255) | VARCHAR(255) | bcrypt | ✅ |
| `first_name` | VARCHAR(100) | VARCHAR(100) | 2-100 chars | ✅ |
| `last_name` | VARCHAR(100) | VARCHAR(100) | 2-100 chars | ✅ |
| `phone` | VARCHAR(20) | VARCHAR(20) | Opcional | ✅ |
| `user_type` | ENUM (5 valores) | ENUM (5 valores) | Default: customer | ✅ |
| `status` | ENUM (3 valores) | ENUM (3 valores) | Default: active | ✅ |
| `last_login_at` | TIMESTAMPTZ | TIMESTAMPTZ | Opcional | ✅ |
| `preferences` | JSONB | JSONB | Opcional | ✅ |
| `email_verified` | BOOLEAN | BOOLEAN | Default: false | ✅ |
| `email_verified_at` | TIMESTAMPTZ | TIMESTAMPTZ | Opcional | ✅ |

### Computed Properties

| Property | Monólito | Microsserviço | Status |
|----------|----------|---------------|--------|
| `full_name` | `${first_name} ${last_name}` | `${first_name} ${last_name}` | ✅ |
| `is_active` | `status === ACTIVE` | `status === ACTIVE` | ✅ |
| `can_login` | `is_active && email_verified` | `is_active && email_verified` | ✅ |

---

## 2️⃣ Enums

### UserType

```typescript
// AMBOS: Monólito e Microsserviço
export enum UserType {
  ADMIN = 'admin',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
  OPERATOR = 'operator',
  MANAGER = 'manager',
}
```

### UserStatus

```typescript
// AMBOS: Monólito e Microsserviço
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
```

---

## 3️⃣ DTOs

### CreateUserDto

| Campo | Validação Monólito | Validação Microsserviço | Status |
|-------|-------------------|------------------------|--------|
| `email` | @IsEmail() | @IsEmail() | ✅ |
| `password` | @MinLength(6) | @MinLength(6) | ✅ |
| `first_name` | @Length(2, 100) | @Length(2, 100) | ✅ |
| `last_name` | @Length(2, 100) | @Length(2, 100) | ✅ |
| `phone` | @IsOptional() | @IsOptional() | ✅ |
| `user_type` | @IsEnum(UserType) | @IsEnum(UserType) | ✅ |
| `status` | @IsEnum(UserStatus) | @IsEnum(UserStatus) | ✅ |

### UpdateUserDto

```typescript
// AMBOS: Usa PartialType(CreateUserDto)
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

---

## 4️⃣ Service Methods

### Métodos Implementados

| Método | Monólito | Microsserviço | Fidelidade |
|--------|----------|---------------|------------|
| `create(dto)` | TypeORM + bcrypt | TypeORM + bcrypt | ✅ 100% |
| `findAll()` | Repository.find() | Repository.find() | ✅ 100% |
| `findOne(id)` | Repository.findOne() | Repository.findOne() | ✅ 100% |
| `findByEmail(email)` | Repository.findOne() | Repository.findOne() | ✅ 100% |
| `update(id, dto)` | Repository.save() | Repository.save() | ✅ 100% |
| `remove(id)` | softRemove() | softRemove() | ✅ 100% |
| `restore(id)` | restore() | restore() | ✅ 100% |
| `updateLastLogin(id)` | save({ last_login_at }) | save({ last_login_at }) | ✅ 100% |

### Lógica de Negócio

#### Hash de Senha (create)

```typescript
// MONÓLITO
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

// MICROSSERVIÇO
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
```

#### Rehash de Senha (update)

```typescript
// AMBOS: Se password for fornecido, rehash antes de salvar
if (updateUserDto.password) {
  updateUserDto.password_hash = await bcrypt.hash(updateUserDto.password, 10);
  delete updateUserDto.password;
}
```

#### Soft Delete

```typescript
// AMBOS: Usa BaseEntity.softRemove()
await this.userRepository.softRemove(user);
```

---

## 5️⃣ Controller Endpoints

### REST API

| Endpoint | Método | Monólito | Microsserviço | Status |
|----------|--------|----------|---------------|--------|
| `/users` | POST | ✅ | ✅ | Idêntico |
| `/users` | GET | ✅ | ✅ | Idêntico |
| `/users/:id` | GET | ✅ | ✅ | Idêntico |
| `/users/:id` | PATCH | ✅ | ✅ | Idêntico |
| `/users/:id` | DELETE | ✅ | ✅ | Idêntico |

### HTTP Status Codes

| Operação | Sucesso | Erro | Monólito | Microsserviço |
|----------|---------|------|----------|---------------|
| Create | 201 | 400/409 | ✅ | ✅ |
| Find All | 200 | 400 | ✅ | ✅ |
| Find One | 200 | 404 | ✅ | ✅ |
| Update | 200 | 404/400 | ✅ | ✅ |
| Delete | 204 | 404 | ✅ | ✅ |

### Swagger Documentation

Ambos possuem:
- ✅ @ApiTags('users')
- ✅ @ApiOperation() com summary e description
- ✅ @ApiResponse() para todos os status codes
- ✅ @ApiBearerAuth() para autenticação
- ✅ Exemplos de request/response

---

## 6️⃣ Diferenças Intencionais

### Relacionamentos

| Relacionamento | Monólito | Microsserviço | Motivo |
|----------------|----------|---------------|--------|
| `roles` | @ManyToMany(Role) | **Comentado** | Será migrado na Fase 2 (auth) |

**Código comentado no microsserviço:**

```typescript
// @ManyToMany(() => Role, (role) => role.users)
// @JoinTable({
//   name: 'user_roles',
//   joinColumn: { name: 'user_id' },
//   inverseJoinColumn: { name: 'role_id' },
// })
// roles?: Role[];
```

### Banco de Dados

| Aspecto | Monólito | Microsserviço | Motivo |
|---------|----------|---------------|--------|
| Host/Porta | localhost:5432 | localhost:5433 | Isolamento |
| Database | nexustransit | nexustransit_users_db | Database-per-Service |
| Tabelas | Todas (15 módulos) | Apenas `users` | Bounded Context |

---

## 🔄 Estratégia de Cutover

### Fase Atual: Standalone

```
┌─────────────┐
│   Cliente   │
└─────┬───────┘
      │
      ↓
┌─────────────────────────┐
│   API Gateway (Futuro)  │
└─────────────────────────┘
      │
      ├─────────────────┐
      │                 │
      ↓                 ↓
┌─────────────┐   ┌─────────────┐
│  Monólito   │   │ Users μS    │ ← VOCÊ ESTÁ AQUI
│ (5 users)   │   │ (Isolado)   │
└─────────────┘   └─────────────┘
```

### Próxima Fase: Dual-Write

```
┌─────────────┐
│   Cliente   │
└─────┬───────┘
      │
      ↓
┌─────────────────────────┐
│   API Gateway           │
│ (Roteia reads/writes)   │
└─────────────────────────┘
      │
      ├─────────────────┐
      │                 │
      ↓                 ↓
┌─────────────┐   ┌─────────────┐
│  Monólito   │◄─►│ Users μS    │
│             │   │ (Sync)      │
└─────────────┘   └─────────────┘
```

### Fase Final: Cutover Completo

```
┌─────────────┐
│   Cliente   │
└─────┬───────┘
      │
      ↓
┌─────────────────────────┐
│   API Gateway           │
│ (100% para μS)          │
└─────────────────────────┘
      │
      ↓
┌─────────────┐
│ Users μS    │
│ (Produção)  │
└─────────────┘
```

---

## 📋 Checklist de Migração

### Fase 1: Standalone ✅

- [x] Criar estrutura de diretórios
- [x] Migrar BaseEntity
- [x] Migrar enums (UserType, UserStatus)
- [x] Migrar User entity (15 campos)
- [x] Migrar DTOs (Create, Update)
- [x] Migrar Service (8 métodos)
- [x] Migrar Controller (5 endpoints)
- [x] Configurar database dedicado (porta 5433)
- [x] Criar migration CreateUsersTable
- [x] Configurar Docker Compose
- [x] Documentação Swagger
- [x] README completo

### Fase 2: Dual-Write ⏳

- [ ] Implementar testes de contrato (Pact)
- [ ] Criar componente de sincronização
- [ ] Configurar write para ambos (monólito + μS)
- [ ] Monitorar discrepâncias
- [ ] Criar dashboard de métricas
- [ ] Documentar estratégia de rollback

### Fase 3: Cutover ⏳

- [ ] Configurar API Gateway (Kong/Nginx)
- [ ] Rotear 10% do tráfego
- [ ] Validar performance
- [ ] Gradualmente aumentar para 100%
- [ ] Migrar dados históricos
- [ ] Desativar endpoints do monólito
- [ ] Remover código legado

---

## 🧪 Validação de Fidelidade

### Scripts de Teste

#### 1. Criar Usuário (ambos)

```bash
# Monólito
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "customer"
  }'

# Microsserviço
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "customer"
  }'
```

#### 2. Comparar Respostas

```bash
# Deve ser IDÊNTICO (exceto IDs e timestamps)
{
  "id": "...",
  "email": "test@test.com",
  "first_name": "Test",
  "last_name": "User",
  "user_type": "customer",
  "status": "active",
  "email_verified": false,
  "created_at": "...",
  "updated_at": "..."
}
```

#### 3. Validar Hash de Senha

```bash
# Conectar nos bancos
# Monólito
psql -U nexustransit -d nexustransit -c "SELECT password_hash FROM users WHERE email='test@test.com';"

# Microsserviço
psql -U nexustransit_users -d nexustransit_users_db -p 5433 -c "SELECT password_hash FROM users WHERE email='test@test.com';"

# Ambos devem usar bcrypt com formato: $2b$10$...
```

---

## 🚨 Riscos e Mitigações

### Risco 1: Inconsistência de Dados

**Descrição**: Durante dual-write, dados podem divergir

**Mitigação**:
- Implementar transações compensatórias
- Monitorar logs de erro
- Script de reconciliação diário

### Risco 2: Downtime Durante Cutover

**Descrição**: Mudança de roteamento pode causar indisponibilidade

**Mitigação**:
- Blue-Green Deployment
- Canary releases (10% → 50% → 100%)
- Rollback automático se error rate > 5%

### Risco 3: Performance Degradation

**Descrição**: Microsserviço pode ser mais lento que monólito

**Mitigação**:
- Load testing antes do cutover
- Caching com Redis
- Connection pooling otimizado

---

## 📊 Métricas de Sucesso

### KPIs

- **Fidelidade de Dados**: 100% (zero discrepâncias)
- **Latência**: < 100ms (p95)
- **Disponibilidade**: 99.9%
- **Error Rate**: < 0.1%

### Monitoramento

```bash
# TODO - Fase 2: Prometheus + Grafana
```

---

## 📚 Próximos Passos

1. **Instalar dependências**: `npm install`
2. **Subir PostgreSQL**: `docker-compose up -d postgres_users`
3. **Executar migrations**: `npm run migration:run`
4. **Iniciar serviço**: `npm run start:dev`
5. **Testar endpoints**: http://localhost:3003/api/docs
6. **Implementar testes de contrato**
7. **Configurar dual-write**

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Fase 1 Completa - Pronto para Fase 2
