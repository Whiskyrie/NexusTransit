# 📦 Plano de Extração de Packages - NexusTransit

## 🎯 Objetivo

Preparar a arquitetura do NexusTransit para futura migração para microserviços através da extração de lógica compartilhada em packages reutilizáveis.

---

## 📊 Estado Atual

### ✅ Packages Existentes (Infraestrutura)

| Package | Responsabilidade | Status |
|---------|------------------|--------|
| `@nexus/audit` | Sistema de auditoria | ✅ OK |
| `@nexus/auth` | Utilitários de autenticação (guards, decorators) | ✅ OK |
| `@nexus/common` | DTOs base, validators, transformers | ✅ OK |
| `@nexus/database` | Database factory, config TypeORM | ✅ OK |
| `@nexus/logger` | Logging estruturado (Pino) | ✅ OK |
| `@nexus/redis` | Cliente Redis configurado | ✅ OK |

### 📦 Módulos na API (Candidatos)

| Módulo | Tipo | Dependências | Candidato a Package? |
|--------|------|--------------|---------------------|
| `users/` | Domínio | auth, roles | ❌ Fica na API |
| `auth/` | Domínio | users | ❌ Fica na API |
| `roles/` | Domínio | - | ❌ Fica na API |
| `drivers/` | Domínio | users | ❌ Fica na API |
| `vehicles/` | Domínio | - | ❌ Fica na API |
| `customers/` | Domínio | users | ❌ Fica na API |
| `deliveries/` | Domínio | customers, drivers, vehicles, routes | ❌ Fica na API |
| `routes/` | Domínio | vehicles, drivers | ❌ Fica na API |
| `service-orders/` | Domínio | vehicles, drivers | ❌ Fica na API |
| `incidents/` | Domínio | deliveries | ❌ Fica na API |
| `tracking/` | Domínio | deliveries, vehicles | ❌ Fica na API |
| `upload/` | Infraestrutura | - | ✅ **SIM - @nexus/storage** |
| `lgpd/` | Infraestrutura | - | ✅ **SIM - @nexus/compliance** |
| `reports/` | Infraestrutura | - | ✅ **SIM - @nexus/reporting** |
| `rate-limit/` | Infraestrutura | redis | ✅ **SIM - @nexus/rate-limit** |

---

## 🏗️ Packages a Criar

### 1. **@nexus/storage** 📁

**Responsabilidade:** Upload, armazenamento e gestão de arquivos

**Conteúdo:**
- Serviço de upload (Local, S3, etc)
- Validação de arquivos (tipo, tamanho)
- Processamento de imagens (Sharp)
- Storage adapters (Strategy Pattern)
- Interfaces de configuração

**Arquivos a extrair:**
```
apps/api/src/modules/upload/
├── upload.service.ts          → packages/storage/src/services/storage.service.ts
├── upload.module.ts           → packages/storage/src/storage.module.ts
├── dto/upload.dto.ts          → packages/storage/src/dto/upload.dto.ts
├── interfaces/                → packages/storage/src/interfaces/
└── config/                    → packages/storage/src/config/
```

**Dependências:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `multer`
- `sharp`
- `@aws-sdk/client-s3` (opcional)

---

### 2. **@nexus/compliance** 🔒

**Responsabilidade:** Conformidade LGPD, privacidade e proteção de dados

**Conteúdo:**
- Serviço de anonimização
- Exportação de dados pessoais
- Exclusão de dados (direito ao esquecimento)
- Decorators para campos sensíveis
- Auditoria de acesso a dados

**Arquivos a extrair:**
```
apps/api/src/modules/lgpd/
├── lgpd.service.ts            → packages/compliance/src/services/compliance.service.ts
├── lgpd.module.ts             → packages/compliance/src/compliance.module.ts
├── decorators/                → packages/compliance/src/decorators/
├── interfaces/                → packages/compliance/src/interfaces/
└── utils/                     → packages/compliance/src/utils/
```

**Dependências:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/typeorm`
- `@nexus/audit`
- `crypto` (Node.js built-in)

---

### 3. **@nexus/reporting** 📊

**Responsabilidade:** Geração e exportação de relatórios

**Conteúdo:**
- Geração de relatórios (PDF, Excel, CSV)
- Templates de relatórios
- Agendamento de relatórios
- Cache de relatórios pesados
- Streaming de dados grandes

**Arquivos a extrair:**
```
apps/api/src/modules/reports/
├── reports.service.ts         → packages/reporting/src/services/reporting.service.ts
├── reports.module.ts          → packages/reporting/src/reporting.module.ts
├── generators/                → packages/reporting/src/generators/
├── templates/                 → packages/reporting/src/templates/
├── dto/                       → packages/reporting/src/dto/
└── interfaces/                → packages/reporting/src/interfaces/
```

**Dependências:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `@nexus/redis` (cache)
- `pdfkit` ou `puppeteer`
- `exceljs`
- `csv-writer`

---

### 4. **@nexus/rate-limit** 🚦

**Responsabilidade:** Rate limiting e throttling distribuído

**Conteúdo:**
- Rate limiter baseado em Redis
- Guards customizados
- Decorators para limites
- Estratégias (IP, User, API Key)
- Monitoring de quotas

**Arquivos a extrair:**
```
apps/api/src/modules/rate-limit/
├── rate-limit.service.ts      → packages/rate-limit/src/services/rate-limit.service.ts
├── rate-limit.module.ts       → packages/rate-limit/src/rate-limit.module.ts
├── guards/                    → packages/rate-limit/src/guards/
├── decorators/                → packages/rate-limit/src/decorators/
└── interfaces/                → packages/rate-limit/src/interfaces/
```

**Dependências:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/throttler`
- `@nexus/redis`

---

### 5. **@nexus/notifications** 📧 (NOVO)

**Responsabilidade:** Sistema unificado de notificações

**Conteúdo:**
- Serviço de envio de emails
- Templates de notificações
- Fila de notificações
- Providers (Email, SMS, Push)
- Event-driven notifications

**Estrutura:**
```
packages/notifications/
├── src/
│   ├── notifications.module.ts
│   ├── services/
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   └── push.service.ts
│   ├── providers/
│   │   ├── sendgrid.provider.ts
│   │   └── twilio.provider.ts
│   ├── templates/
│   ├── dto/
│   └── interfaces/
├── package.json
└── tsconfig.json
```

**Dependências:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `nodemailer`
- `handlebars` (templates)
- `@nexus/redis` (queue)

---

### 6. **@nexus/events** 🔔 (NOVO)

**Responsabilidade:** Event Bus para comunicação entre módulos

**Conteúdo:**
- Event emitter distribuído
- Event handlers
- Event store (auditoria)
- Saga patterns
- Event sourcing base

**Estrutura:**
```
packages/events/
├── src/
│   ├── events.module.ts
│   ├── services/
│   │   ├── event-bus.service.ts
│   │   └── event-store.service.ts
│   ├── decorators/
│   │   ├── event-handler.decorator.ts
│   │   └── saga.decorator.ts
│   ├── interfaces/
│   └── events/
│       └── base.event.ts
├── package.json
└── tsconfig.json
```

**Dependências:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/event-emitter`
- `@nexus/redis` (pub/sub)

---

## 🚀 Ordem de Implementação

### Fase 1: Infraestrutura Básica (Semana 1-2)
1. ✅ Validar packages existentes
2. 🔨 Criar `@nexus/storage`
3. 🔨 Criar `@nexus/rate-limit`

### Fase 2: Compliance e Reporting (Semana 3-4)
4. 🔨 Criar `@nexus/compliance`
5. 🔨 Criar `@nexus/reporting`

### Fase 3: Comunicação (Semana 5-6)
6. 🔨 Criar `@nexus/notifications`
7. 🔨 Criar `@nexus/events`

### Fase 4: Refatoração da API (Semana 7-8)
8. 🔨 Migrar módulos da API para usar novos packages
9. 🔨 Remover código duplicado
10. 🔨 Atualizar imports e dependências

### Fase 5: Testes e Documentação (Semana 9-10)
11. 🧪 Testes unitários de cada package
12. 🧪 Testes de integração
13. 📚 Documentação de cada package
14. 📚 Guias de uso e exemplos

---

## 🎯 Benefícios Esperados

### Para Microserviços Futuros

✅ **Reutilização de código:** Packages compartilhados entre serviços  
✅ **Manutenção centralizada:** Bugs corrigidos em um lugar  
✅ **Versionamento independente:** Cada package evolui no seu ritmo  
✅ **Testes isolados:** Maior confiança nas mudanças  
✅ **Deploy independente:** Publique apenas o que mudou  

### Para Desenvolvimento

✅ **Boundaries claros:** Separação de responsabilidades  
✅ **Type safety:** Tipos compartilhados entre packages  
✅ **DRY:** Sem duplicação de código  
✅ **Modular:** Fácil adicionar/remover funcionalidades  
✅ **Testável:** Mocks mais simples  

---

## 🔧 Padrão de Package

### Estrutura Base

```
packages/{package-name}/
├── src/
│   ├── index.ts                    # Exports públicos
│   ├── {package-name}.module.ts    # NestJS Module
│   ├── services/                   # Serviços
│   ├── interfaces/                 # Interfaces públicas
│   ├── dto/                        # DTOs
│   ├── decorators/                 # Decorators
│   ├── guards/                     # Guards
│   ├── config/                     # Configurações
│   └── constants/                  # Constantes
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### Package.json Template

```json
{
  "name": "@nexus/{package-name}",
  "version": "1.0.0",
  "description": "Descrição do package",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist tsconfig.tsbuildinfo",
    "lint": "eslint . --ext .ts"
  },
  "peerDependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 📝 Checklist de Extração

Para cada package a ser criado:

- [ ] Criar estrutura de diretórios
- [ ] Configurar package.json
- [ ] Configurar tsconfig.json
- [ ] Mover código do módulo da API
- [ ] Ajustar imports
- [ ] Criar exports no index.ts
- [ ] Criar NestJS Module
- [ ] Adicionar README.md
- [ ] Adicionar testes unitários
- [ ] Atualizar API para usar o package
- [ ] Remover código antigo da API
- [ ] Validar build
- [ ] Validar testes
- [ ] Documentar breaking changes

---

## 🎓 Princípios de Design

### 1. **Single Responsibility**
Cada package deve ter uma única responsabilidade clara.

### 2. **Open/Closed**
Aberto para extensão, fechado para modificação.

### 3. **Dependency Inversion**
Dependa de abstrações, não de implementações.

### 4. **Interface Segregation**
Interfaces específicas melhor que genéricas.

### 5. **Don't Repeat Yourself**
Código compartilhado deve estar em packages.

---

## 🔄 Migração para Microserviços

### Estratégia Strangler Fig Pattern

```
Monolito (Atual)
    ↓
Monolito + Packages (Fase Atual)
    ↓
Monolito + Microserviços Híbrido
    ↓
Microserviços Puros
```

### Candidatos a Microserviços (Futuro)

1. **Auth Service** - Autenticação e autorização
2. **Delivery Service** - Gestão de entregas
3. **Tracking Service** - Rastreamento em tempo real
4. **Notification Service** - Notificações
5. **Reporting Service** - Relatórios
6. **File Service** - Upload e storage

**Packages serão compartilhados entre todos os serviços!**

---

## 📚 Referências

- [NestJS Monorepo](https://docs.nestjs.com/cli/monorepo)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [Martin Fowler - Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Microservices Patterns](https://microservices.io/patterns/index.html)

---

**Data:** Dezembro 2025  
**Versão:** 1.0  
**Status:** 📋 Planejamento
