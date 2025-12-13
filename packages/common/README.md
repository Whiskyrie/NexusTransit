# @nexus/common

Utilitários compartilhados, validadores, DTOs e classes base para o NexusTransit.

## Instalação

```bash
pnpm add @nexus/common
```

## Funcionalidades

- **BaseEntity** - Entidade base com campos comuns (id, timestamps, soft delete)
- **Validadores** - CPF, CNH, MOPP, Placa (Mercosul e antiga)
- **DTOs Base** - Filtros, paginação, respostas padronizadas
- **Transformers** - Point (PostGIS), datas, strings
- **Interceptors** - Transformação de respostas
- **Interfaces** - Tipos compartilhados

## Uso

### BaseEntity

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@nexus/common';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Column()
  license_plate: string;
  
  // Herda automaticamente:
  // - id: string (UUID)
  // - created_at: Date
  // - updated_at: Date
  // - deleted_at: Date | null (soft delete)
}
```

### Validadores

```typescript
import { IsCPF, IsCNH, IsLicensePlate } from '@nexus/common';

class CreateDriverDto {
  @IsCPF()
  cpf: string;

  @IsCNH()
  cnh_number: string;

  @IsLicensePlate()
  license_plate: string;
}
```

### Normalizadores

```typescript
import { normalizeCPF, normalizeLicensePlate } from '@nexus/common';

const cpf = normalizeCPF('123.456.789-00');      // → '12345678900'
const plate = normalizeLicensePlate('ABC-1234'); // → 'ABC1234'
```

### DTOs de Paginação

```typescript
import { BaseFilterDto, PaginatedResponseDto } from '@nexus/common';

class VehicleFilterDto extends BaseFilterDto {
  @IsOptional()
  status?: VehicleStatus;
}

// Resposta paginada
async findAll(filter: VehicleFilterDto): Promise<PaginatedResponseDto<Vehicle>> {
  const [data, total] = await this.repository.findAndCount({
    take: filter.limit,
    skip: (filter.page - 1) * filter.limit,
  });

  return {
    data,
    meta: {
      page: filter.page,
      limit: filter.limit,
      total,
      total_pages: Math.ceil(total / filter.limit),
      has_previous: filter.page > 1,
      has_next: filter.page < Math.ceil(total / filter.limit),
    },
  };
}
```

### Transformers PostGIS

```typescript
import { Column } from 'typeorm';
import { PointTransformer } from '@nexus/common';

@Entity()
class Location extends BaseEntity {
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: new PointTransformer(),
  })
  coordinates: { latitude: number; longitude: number };
}
```

## Validadores Disponíveis

### CPF

```typescript
@IsCPF()
cpf: string;  // Valida formato e dígitos verificadores
```

### CNH

```typescript
@IsCNH()
cnh_number: string;  // Valida CNH brasileira (11 dígitos)
```

### Placa de Veículo

```typescript
@IsLicensePlate()
license_plate: string;  // Suporta Mercosul (ABC1D23) e antiga (ABC-1234)
```

### MOPP

```typescript
@IsMOPP()
mopp_certificate: string;  // Valida certificado MOPP
```

## Interfaces

```typescript
// Paginação
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}

interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}

// Coordenadas
interface Point {
  latitude: number;
  longitude: number;
}
```

## Exports

```typescript
// Entidades
export { BaseEntity } from './database/base.entity';

// DTOs
export { BaseFilterDto } from './dto/base-filter.dto';
export { PaginatedResponseDto } from './dto/paginated-response.dto';

// Validadores
export { IsCPF, IsCNH, IsLicensePlate, IsMOPP } from './validators/';
export { normalizeCPF, normalizeCNH, normalizeLicensePlate } from './validators/';

// Transformers
export { PointTransformer } from './transformers/point.transformer';

// Interceptors
export { TransformInterceptor } from './interceptors/transform.interceptor';
```

## Dependências

- `class-validator`
- `class-transformer`
- `typeorm`

## Licença

UNLICENSED - Propriedade do NexusTransit
