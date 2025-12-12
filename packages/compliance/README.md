# @nexus/compliance

Módulo de conformidade LGPD/GDPR para o NexusTransit.

## Instalação

```bash
pnpm add @nexus/compliance
```

## Funcionalidades

- Gerenciamento de consentimentos
- Solicitações de dados (exportação)
- Direito ao esquecimento
- Portabilidade de dados
- Auditoria de acessos

## Uso

```typescript
import { ComplianceModule } from '@nexus/compliance';

@Module({
  imports: [ComplianceModule],
})
export class AppModule {}
```

## Endpoints

- `POST /compliance/consent` - Registrar consentimento
- `GET /compliance/data-request` - Solicitar dados
- `POST /compliance/data-portability` - Exportar dados
- `DELETE /compliance/right-to-be-forgotten` - Solicitar exclusão

## Licença

UNLICENSED - Propriedade do NexusTransit
