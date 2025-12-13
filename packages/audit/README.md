# @nexus/audit

Sistema de auditoria automática para rastreamento de mudanças em entidades do NexusTransit.

## Instalação

```bash
pnpm add @nexus/audit
```

## Funcionalidades

- Auditoria automática via TypeORM Subscribers
- Rastreamento de operações CREATE, UPDATE, DELETE
- Registro de valores antigos e novos
- Captura de contexto do usuário (ID, email, role)
- Decorador `@Auditable` para controle fino
- Exclusão de campos sensíveis
- Integração com sistema de logging

## Uso

### 1. Importar o módulo

```typescript
import { AuditModule } from '@nexus/audit';

@Module({
  imports: [
    TypeOrmModule.forFeature([MinhaEntidade]),
    AuditModule,
  ],
})
export class MeuModule {}
```

### 2. Marcar entidade como auditável

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Auditable } from '@nexus/audit';

@Entity('vehicles')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at'],
  entityDisplayName: 'Veículo',
})
export class Vehicle extends BaseEntity {
  @Column()
  license_plate: string;

  @Column()
  model: string;
}
```

### 3. Logs automáticos

Todas as operações serão automaticamente auditadas:

```typescript
// CREATE
await vehicleRepository.save({ license_plate: 'ABC-1234', model: 'Fiat Uno' });
// → Gera log: CREATE | Vehicle | license_plate: ABC-1234

// UPDATE
vehicle.model = 'Fiat Uno Vivace';
await vehicleRepository.save(vehicle);
// → Gera log: UPDATE | Vehicle | model: Fiat Uno → Fiat Uno Vivace

// DELETE (soft)
await vehicleRepository.softRemove(vehicle);
// → Gera log: DELETE | Vehicle | license_plate: ABC-1234
```

## Opções do Decorador

```typescript
interface AuditableOptions {
  trackCreation?: boolean;      // Auditar criações (padrão: true)
  trackUpdates?: boolean;        // Auditar atualizações (padrão: true)
  trackDeletion?: boolean;       // Auditar deleções (padrão: true)
  excludeFields?: string[];      // Campos a ignorar
  trackOldValues?: boolean;      // Salvar valores antigos (padrão: true)
  entityDisplayName?: string;    // Nome amigável da entidade
}
```

## Estrutura do Log de Auditoria

```typescript
interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;         // Nome da entidade
  entity_id: string;            // ID do registro
  user_id?: string;             // ID do usuário
  user_email?: string;          // Email do usuário
  old_values?: Record<string, any>;  // Valores antes
  new_values?: Record<string, any>;  // Valores depois
  ip_address?: string;          // IP da requisição
  user_agent?: string;          // User agent
  created_at: Date;
}
```

## Configuração Avançada

### Desabilitar auditoria em operações específicas

```typescript
@Auditable({
  trackCreation: true,
  trackUpdates: false,  // Não auditar updates
  trackDeletion: true,
})
```

### Excluir campos sensíveis

```typescript
@Auditable({
  excludeFields: ['password', 'secret_token', 'updated_at'],
})
```

## API

### AuditService

```typescript
class AuditService {
  // Criar log manualmente
  async create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity>

  // Log de ação customizada
  async logAction(params: {
    action: AuditAction;
    category: AuditCategory;
    userId?: string;
    resourceType: string;
    resourceId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>
}
```

## Enums

```typescript
enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

enum AuditCategory {
  USER = 'USER',
  VEHICLE = 'VEHICLE',
  DELIVERY = 'DELIVERY',
  SYSTEM = 'SYSTEM',
}
```

## Dependências

- `@nestjs/common`
- `@nestjs/typeorm`
- `typeorm`
- `@nexus/common` (BaseEntity)
