# @nexus/reporting

Sistema de geração de relatórios para o NexusTransit.

## Instalação

```bash
pnpm add @nexus/reporting
```

## Funcionalidades

- Relatórios de entregas
- Relatórios de veículos
- Relatórios de motoristas
- Relatórios de rotas
- Exportação PDF/Excel
- Relatórios agendados

## Uso

```typescript
import { ReportingModule } from '@nexus/reporting';

@Module({
  imports: [ReportingModule],
})
export class AppModule {}
```

## Serviços

```typescript
class ReportingService {
  async generateDeliveryReport(filters: ReportFilters): Promise<Report>
  async generateVehicleReport(filters: ReportFilters): Promise<Report>
  async scheduleReport(config: ReportConfig): Promise<void>
}
```

## Licença

UNLICENSED - Propriedade do NexusTransit
