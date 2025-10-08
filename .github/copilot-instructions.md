# GitHub Copilot - Instruções de Arquitetura NexusTransit

## 📋 Visão Geral

Sistema de gerenciamento de logística e entregas construído com NestJS, TypeORM e PostgreSQL seguindo princípios de Clean Architecture e Domain-Driven Design.

---

## 🏗️ Estrutura de Módulos

### Padrão de Organização de Diretórios

Cada módulo deve seguir a seguinte estrutura:

```
src/modules/{module-name}/
├── {module-name}.module.ts          # Módulo principal
├── {module-name}.controller.ts      # Controller REST
├── {module-name}.service.ts         # Service principal
├── dto/                             # Data Transfer Objects
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   ├── {entity}-filter.dto.ts
│   └── {entity}-response.dto.ts
├── entities/                        # Entidades TypeORM
│   ├── {entity}.entity.ts
│   └── {related-entity}.entity.ts
├── enums/                          # Enumerações
│   └── {entity}-status.enum.ts
├── validators/                      # Validadores customizados
│   └── {field}.validator.ts
├── decorators/                      # Decoradores customizados
│   └── auditable.decorator.ts
├── services/                        # Serviços auxiliares
│   └── {specific}.service.ts
├── subscribers/                     # TypeORM Subscribers
│   └── {entity}.subscriber.ts
├── interceptors/                    # NestJS Interceptors
│   └── {specific}.interceptor.ts
├── pipes/                          # NestJS Pipes
│   └── {specific}.pipe.ts
├── interfaces/                      # Interfaces TypeScript
│   └── {entity}.interface.ts
├── constants/                       # Constantes do módulo
│   └── {entity}.constants.ts
├── utils/                          # Utilitários
│   └── {specific}.util.ts
├── config/                         # Configurações
│   └── {specific}.config.ts
└── exceptions/                     # Exceções customizadas
    └── {specific}.exception.ts
```

---

## 📦 Padrão de Entidades (TypeORM)

### Classe Base

Todas as entidades devem estender `BaseEntity`:

```typescript
import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../database/entities/base.entity";
import { Auditable } from "../decorators/auditable.decorator";

@Entity("{table_name}")
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ["updated_at", "created_at"],
  entityDisplayName: "{Nome da Entidade}",
})
export class EntityName extends BaseEntity {
  @Column({
    type: "varchar",
    length: 100,
    comment: "Descrição do campo",
  })
  field_name!: string;

  // Relacionamentos
  @OneToMany(() => RelatedEntity, (related) => related.entity)
  related_entities?: RelatedEntity[];

  @ManyToOne(() => ParentEntity, (parent) => parent.children)
  parent?: ParentEntity;
}
```

### Características Obrigatórias

- **Herdar de `BaseEntity`**: Fornece `id`, `created_at`, `updated_at`, `deleted_at`
- **Usar decorator `@Auditable`**: Para rastreamento de mudanças
- **Comentários em colunas**: Sempre adicionar `comment` nas definições
- **Tipos explícitos**: Especificar `type`, `length`, `precision`, `scale`
- **Snake_case**: Para nomes de colunas e tabelas
- **Soft Delete**: Implementado automaticamente via `BaseEntity`

---

## 📝 Padrão de DTOs

### Create DTO

```typescript
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateEntityDto {
  @ApiProperty({
    description: "Descrição detalhada do campo",
    example: "Exemplo de valor",
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  field_name!: string;

  @ApiPropertyOptional({
    description: "Campo opcional",
    example: "Valor opcional",
    default: "valor_padrao",
  })
  @IsOptional()
  @IsString()
  optional_field?: string;

  @ApiProperty({
    description: "Campo enumerado",
    enum: StatusEnum,
    example: StatusEnum.ACTIVE,
  })
  @IsEnum(StatusEnum)
  status: StatusEnum = StatusEnum.ACTIVE;
}
```

### Update DTO

```typescript
import { PartialType } from "@nestjs/swagger";
import { CreateEntityDto } from "./create-entity.dto";

export class UpdateEntityDto extends PartialType(CreateEntityDto) {}
```

### Filter DTO

```typescript
import { IsOptional, IsEnum, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BaseFilterDto } from "../../../common/dto/base-filter.dto";

export class EntityFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: "Filtrar por status",
    enum: StatusEnum,
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiPropertyOptional({
    description: "Data de início",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;
}
```

### Response DTO

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class EntityResponseDto {
  @ApiProperty({
    description: "ID único da entidade",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id!: string;

  @ApiProperty({
    description: "Nome da entidade",
    example: "Nome Exemplo",
  })
  field_name!: string;

  @ApiProperty({
    description: "Data de criação",
    example: "2024-01-01T00:00:00Z",
  })
  created_at!: Date;

  @ApiProperty({
    description: "Data de atualização",
    example: "2024-01-01T00:00:00Z",
  })
  updated_at!: Date;

  @Exclude()
  sensitive_field?: string;
}
```

---

## 🎯 Padrão de Controllers

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { EntityService } from "./entity.service";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { EntityFilterDto } from "./dto/entity-filter.dto";
import { EntityResponseDto } from "./dto/entity-response.dto";
import { PaginatedResponseDto } from "../../common/dto/paginated-response.dto";

@ApiTags("Entities")
@Controller("entities")
@ApiBearerAuth()
export class EntitiesController {
  constructor(private readonly entitiesService: EntityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Criar nova entidade",
    description: "Descrição detalhada da operação",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Entidade criada com sucesso",
    type: EntityResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Dados inválidos fornecidos",
  })
  @ApiConflictResponse({
    description: "Entidade já existe",
  })
  @ApiUnauthorizedResponse({
    description: "Token de autenticação inválido ou ausente",
  })
  @ApiForbiddenResponse({
    description: "Usuário não possui permissão",
  })
  async create(@Body() createDto: CreateEntityDto): Promise<EntityResponseDto> {
    return this.entitiesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: "Listar entidades",
    description: "Lista com filtros, paginação e busca",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    example: 1,
    description: "Número da página",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    example: 10,
    description: "Itens por página (máximo 100)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de entidades",
    type: [EntityResponseDto],
  })
  async findAll(
    @Query() filterDto: EntityFilterDto
  ): Promise<PaginatedResponseDto<EntityResponseDto>> {
    return this.entitiesService.findAll(filterDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Buscar entidade por ID",
    description: "Retorna detalhes completos da entidade",
  })
  @ApiParam({
    name: "id",
    description: "ID único da entidade",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Entidade encontrada",
    type: EntityResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Entidade não encontrada",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<EntityResponseDto> {
    return this.entitiesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Atualizar entidade",
    description: "Atualiza campos específicos da entidade",
  })
  @ApiParam({
    name: "id",
    description: "ID único da entidade",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Entidade atualizada com sucesso",
    type: EntityResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Entidade não encontrada",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEntityDto
  ): Promise<EntityResponseDto> {
    return this.entitiesService.update(id, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remover entidade",
    description: "Soft delete da entidade",
  })
  @ApiParam({
    name: "id",
    description: "ID único da entidade",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Entidade removida com sucesso",
  })
  @ApiNotFoundResponse({
    description: "Entidade não encontrada",
  })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.entitiesService.remove(id);
  }
}
```

### Convenções de Controllers

- **ApiTags**: Nome do módulo no plural
- **ApiBearerAuth**: Sempre incluir para endpoints protegidos
- **HttpCode**: Definir explicitamente quando diferente do padrão
- **ParseUUIDPipe**: Validar UUIDs nos parâmetros
- **Documentação completa**: Todas as respostas documentadas

---

## 🔧 Padrão de Services

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, ILike } from "typeorm";
import { Entity } from "./entities/entity.entity";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { EntityFilterDto } from "./dto/entity-filter.dto";
import { EntityResponseDto } from "./dto/entity-response.dto";
import { PaginatedResponseDto } from "../../common/dto/paginated-response.dto";

@Injectable()
export class EntitiesService {
  private readonly logger = new Logger(EntitiesService.name);

  constructor(
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>
  ) {}

  async create(createDto: CreateEntityDto): Promise<EntityResponseDto> {
    // 1. Validações específicas
    const exists = await this.entityRepository.findOne({
      where: { unique_field: createDto.unique_field },
    });

    if (exists) {
      throw new BadRequestException("Entidade já existe");
    }

    // 2. Preparar dados
    const entityData: Partial<Entity> = {
      ...createDto,
    };

    // 3. Criar e salvar
    const entity = this.entityRepository.create(entityData);
    const saved = await this.entityRepository.save(entity);

    // 4. Log de auditoria
    this.logger.log(`Entidade criada: ${saved.id}`);

    // 5. Retornar DTO de resposta
    return this.mapToResponseDto(saved);
  }

  async findAll(
    filterDto: EntityFilterDto
  ): Promise<PaginatedResponseDto<EntityResponseDto>> {
    const { page = 1, limit = 10, search, status, ...filters } = filterDto;

    // 1. Construir where clause
    const where: FindOptionsWhere<Entity> = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    // 2. Executar query com paginação
    const [entities, total] = await this.entityRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: "DESC" },
    });

    // 3. Calcular metadados
    const totalPages = Math.ceil(total / limit);

    // 4. Retornar resposta paginada
    return {
      data: entities.map((e) => this.mapToResponseDto(e)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  async findOne(id: string): Promise<EntityResponseDto> {
    const entity = await this.entityRepository.findOne({
      where: { id },
      relations: ["related_entities"],
    });

    if (!entity) {
      throw new NotFoundException(`Entidade com ID ${id} não encontrada`);
    }

    return this.mapToResponseDto(entity);
  }

  async update(
    id: string,
    updateDto: UpdateEntityDto
  ): Promise<EntityResponseDto> {
    const entity = await this.findEntityOrFail(id);

    // Merge e salvar
    Object.assign(entity, updateDto);
    const updated = await this.entityRepository.save(entity);

    this.logger.log(`Entidade atualizada: ${id}`);

    return this.mapToResponseDto(updated);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findEntityOrFail(id);

    await this.entityRepository.softRemove(entity);

    this.logger.log(`Entidade removida: ${id}`);
  }

  // Métodos auxiliares privados
  private async findEntityOrFail(id: string): Promise<Entity> {
    const entity = await this.entityRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Entidade com ID ${id} não encontrada`);
    }

    return entity;
  }

  private mapToResponseDto(entity: Entity): EntityResponseDto {
    const dto = new EntityResponseDto();
    Object.assign(dto, entity);
    return dto;
  }
}
```

### Convenções de Services

- **Logger**: Sempre instanciar para auditoria
- **Validações**: Realizar antes de operações de escrita
- **Exceções**: Usar exceções específicas do NestJS
- **Soft Delete**: Usar `softRemove` ao invés de `remove`
- **Métodos privados**: Para lógica auxiliar reutilizável
- **Mapeamento**: Sempre mapear entidades para DTOs de resposta

---

## 🎨 Padrão de Modules

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EntitiesService } from "./entities.service";
import { EntitiesController } from "./entities.controller";
import { Entity } from "./entities/entity.entity";
import { RelatedEntity } from "./entities/related-entity.entity";

// Services
import { SpecificService } from "./services/specific.service";

// Interceptors
import { CustomInterceptor } from "./interceptors/custom.interceptor";

// Subscribers
import { EntitySubscriber } from "./subscribers/entity.subscriber";

// Utils
import { EntityUtils } from "./utils/entity.util";

@Module({
  imports: [
    TypeOrmModule.forFeature([Entity, RelatedEntity]),
    HttpModule, // Se precisar fazer requisições HTTP
    ScheduleModule.forRoot(), // Se precisar de agendamentos
  ],
  controllers: [EntitiesController],
  providers: [
    // Services
    EntitiesService,
    SpecificService,

    // Utils
    EntityUtils,

    // Interceptors globais no módulo
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomInterceptor,
    },

    // Subscribers
    EntitySubscriber,
  ],
  exports: [EntitiesService, SpecificService, TypeOrmModule],
})
export class EntitiesModule {}
```

---

## ✅ Padrão de Validadores Customizados

### Estrutura Base

````typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

/**
 * Validador customizado para {descrição}
 *
 * Implementa {algoritmo/regra}
 */
@ValidatorConstraint({ name: "isCustomField", async: false })
export class IsCustomFieldConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    // Implementar lógica de validação
    const normalized = this.normalize(value);
    return this.isValid(normalized);
  }

  private normalize(value: string): string {
    // Normalizar valor
    return value.trim().toUpperCase();
  }

  private isValid(value: string): boolean {
    // Validar valor
    return /^[A-Z0-9]+$/.test(value);
  }

  defaultMessage(): string {
    return "Campo deve estar em formato válido";
  }
}

/**
 * Decorator para validação de campo customizado
 *
 * @example
 * ```typescript
 * class CreateDto {
 *   @IsCustomField()
 *   custom_field: string;
 * }
 * ```
 */
export function IsCustomField(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsCustomFieldConstraint,
    });
  };
}

/**
 * Função auxiliar para normalizar campo
 */
export function normalizeCustomField(value: string): string {
  if (!value) return "";
  return value.trim().toUpperCase();
}

/**
 * Função auxiliar para formatar campo
 */
export function formatCustomField(value: string): string {
  const normalized = normalizeCustomField(value);
  // Aplicar formatação
  return normalized;
}
````

### Validadores Implementados

- **CPF**: `@IsCPF()` - Validação com dígitos verificadores
- **CNH**: `@IsCNH()` - Validação de CNH brasileira
- **Placa**: `@IsLicensePlate()` - Suporta formato antigo e Mercosul
- **MOPP**: `@IsMOPP()` - Validação de certificado MOPP

---

## 🎭 Padrão de Decoradores

### Auditable Decorator

```typescript
import { SetMetadata } from "@nestjs/common";

export const AUDITABLE_ENTITY_KEY = "AUDITABLE_ENTITY";

export interface AuditableOptions {
  trackCreation?: boolean;
  trackUpdates?: boolean;
  trackDeletion?: boolean;
  excludeFields?: string[];
  trackOldValues?: boolean;
  entityDisplayName?: string;
}

export const DEFAULT_AUDITABLE_OPTIONS: AuditableOptions = {
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ["updated_at", "created_at"],
  trackOldValues: true,
  entityDisplayName: "",
};

/**
 * Decorador para marcar entidade como auditável
 */
export const Auditable = (options: AuditableOptions = {}): ClassDecorator => {
  const mergedOptions = { ...DEFAULT_AUDITABLE_OPTIONS, ...options };
  return SetMetadata(AUDITABLE_ENTITY_KEY, mergedOptions);
};

/**
 * Decorador para desabilitar auditoria
 */
export const NonAuditable = (): ClassDecorator =>
  SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: false,
    trackUpdates: false,
    trackDeletion: false,
  });

/**
 * Decorador para auditar operações específicas
 */
export const AuditableOperations = (
  operations: ("CREATE" | "UPDATE" | "DELETE")[]
): ClassDecorator => {
  return SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: operations.includes("CREATE"),
    trackUpdates: operations.includes("UPDATE"),
    trackDeletion: operations.includes("DELETE"),
    excludeFields: ["updated_at", "created_at"],
    trackOldValues: true,
  });
};
```

---

## 📊 Padrão de Enums

```typescript
/**
 * Status do {entidade}
 *
 * Representa os diferentes estados que um {entidade} pode ter
 */
export enum EntityStatus {
  /**
   * Entidade ativa e operacional
   */
  ACTIVE = "ACTIVE",

  /**
   * Entidade temporariamente inativa
   */
  INACTIVE = "INACTIVE",

  /**
   * Entidade em manutenção
   */
  MAINTENANCE = "MAINTENANCE",

  /**
   * Entidade bloqueada
   */
  BLOCKED = "BLOCKED",
}

/**
 * Utilitário para validar status
 */
export function isValidStatus(status: string): status is EntityStatus {
  return Object.values(EntityStatus).includes(status as EntityStatus);
}

/**
 * Utilitário para obter status disponíveis
 */
export function getAvailableStatuses(): EntityStatus[] {
  return Object.values(EntityStatus);
}

/**
 * Utilitário para traduzir status
 */
export function translateStatus(status: EntityStatus): string {
  const translations: Record<EntityStatus, string> = {
    [EntityStatus.ACTIVE]: "Ativo",
    [EntityStatus.INACTIVE]: "Inativo",
    [EntityStatus.MAINTENANCE]: "Em Manutenção",
    [EntityStatus.BLOCKED]: "Bloqueado",
  };
  return translations[status] || status;
}
```

---

## 🔌 Padrão de Subscribers (TypeORM)

```typescript
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
} from "typeorm";
import { Logger } from "@nestjs/common";
import { Entity } from "../entities/entity.entity";

@EventSubscriber()
export class EntitySubscriber implements EntitySubscriberInterface<Entity> {
  private readonly logger = new Logger(EntitySubscriber.name);

  listenTo() {
    return Entity;
  }

  beforeInsert(event: InsertEvent<Entity>): void {
    this.logger.debug(`Before insert: ${JSON.stringify(event.entity)}`);
    // Validações ou transformações antes de inserir
  }

  afterInsert(event: InsertEvent<Entity>): void {
    this.logger.log(`Entity created: ${event.entity.id}`);
    // Lógica após inserção (ex: enviar notificação)
  }

  beforeUpdate(event: UpdateEvent<Entity>): void {
    this.logger.debug(`Before update: ${event.entity?.id}`);
    // Validações antes de atualizar
  }

  afterUpdate(event: UpdateEvent<Entity>): void {
    this.logger.log(`Entity updated: ${event.entity?.id}`);
    // Lógica após atualização
  }

  beforeSoftRemove(event: SoftRemoveEvent<Entity>): void {
    this.logger.debug(`Before soft remove: ${event.entity?.id}`);
  }

  afterSoftRemove(event: SoftRemoveEvent<Entity>): void {
    this.logger.log(`Entity soft removed: ${event.entity?.id}`);
  }
}
```

---

## 🛡️ Padrão de Interceptors

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class CustomInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;

    this.logger.debug(`Before: ${method} ${url}`);

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now;
          this.logger.debug(`After: ${method} ${url} - ${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `Error: ${method} ${url} - ${duration}ms - ${error.message}`
          );
        },
      })
    );
  }
}
```

---

## 🧪 Padrão de Testes

### Service Test

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EntitiesService } from "./entities.service";
import { Entity } from "./entities/entity.entity";
import { NotFoundException } from "@nestjs/common";

describe("EntitiesService", () => {
  let service: EntitiesService;
  let repository: Repository<Entity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitiesService,
        {
          provide: getRepositoryToken(Entity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
    repository = module.get<Repository<Entity>>(getRepositoryToken(Entity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create an entity", async () => {
      const createDto = { name: "Test" };
      const entity = { id: "1", ...createDto };

      mockRepository.create.mockReturnValue(entity);
      mockRepository.save.mockResolvedValue(entity);

      const result = await service.create(createDto);

      expect(result).toEqual(entity);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
    });
  });

  describe("findOne", () => {
    it("should return an entity", async () => {
      const entity = { id: "1", name: "Test" };
      mockRepository.findOne.mockResolvedValue(entity);

      const result = await service.findOne("1");

      expect(result).toEqual(entity);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw NotFoundException", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("1")).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## 🌐 Padrão de Configuração

### Module Config

```typescript
import { ConfigService } from "@nestjs/config";

export const getEntityConfig = (configService: ConfigService) => ({
  maxItems: configService.get<number>("ENTITY_MAX_ITEMS", 100),
  cacheEnabled: configService.get<boolean>("ENTITY_CACHE_ENABLED", true),
  cacheTtl: configService.get<number>("ENTITY_CACHE_TTL", 3600),
});

export interface EntityConfig {
  maxItems: number;
  cacheEnabled: boolean;
  cacheTtl: number;
}
```

---

## 📋 Checklist de Implementação

### Ao criar um novo módulo:

- [ ] Criar estrutura de diretórios padrão
- [ ] Definir entidades com BaseEntity
- [ ] Aplicar decorator @Auditable
- [ ] Criar DTOs (Create, Update, Filter, Response)
- [ ] Implementar validadores customizados se necessário
- [ ] Criar enums necessários
- [ ] Implementar service com Logger
- [ ] Criar controller com documentação Swagger completa
- [ ] Configurar module com imports/exports
- [ ] Adicionar subscribers se necessário
- [ ] Implementar interceptors específicos
- [ ] Criar testes unitários
- [ ] Documentar interfaces e tipos
- [ ] Adicionar constantes do módulo

### Validações Obrigatórias:

- [ ] Todos os campos têm validações class-validator
- [ ] DTOs têm documentação Swagger
- [ ] Endpoints têm todas as respostas documentadas
- [ ] Campos sensíveis são excluídos nos DTOs de resposta
- [ ] Soft delete está implementado
- [ ] Logs de auditoria estão presentes
- [ ] Tratamento de erros está completo

---

## 🔑 Convenções de Nomenclatura

### Arquivos

- **Entities**: `{entity-name}.entity.ts`
- **DTOs**: `create-{entity}.dto.ts`, `update-{entity}.dto.ts`
- **Services**: `{entity-name}.service.ts`
- **Controllers**: `{entity-name}.controller.ts`
- **Modules**: `{entity-name}.module.ts`
- **Validators**: `{field-name}.validator.ts`
- **Enums**: `{entity}-{type}.enum.ts`

### Classes

- **Entities**: PascalCase - `EntityName`
- **DTOs**: PascalCase com sufixo - `CreateEntityDto`
- **Services**: PascalCase com sufixo - `EntityService`
- **Controllers**: PascalCase com sufixo - `EntityController`

### Propriedades

- **Banco de dados**: snake_case - `created_at`, `user_id`
- **TypeScript**: snake_case mantido - `created_at`, `user_id`
- **Constantes**: UPPER_SNAKE_CASE - `MAX_UPLOAD_SIZE`

### Métodos

- **CRUD**: `create`, `findAll`, `findOne`, `update`, `remove`
- **Auxiliares**: `mapToResponseDto`, `findEntityOrFail`
- **Validações**: `validateField`, `isValidField`

---

## 🚀 Exemplos de Casos de Uso Comuns

### 1. Relacionamento ManyToOne

```typescript
@Entity("deliveries")
export class Delivery extends BaseEntity {
  @ManyToOne(() => Customer, (customer) => customer.deliveries)
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @Column({ type: "uuid" })
  customer_id!: string;
}
```

### 2. Relacionamento OneToMany

```typescript
@Entity("customers")
export class Customer extends BaseEntity {
  @OneToMany(() => Delivery, (delivery) => delivery.customer)
  deliveries?: Delivery[];
}
```

### 3. Relacionamento ManyToMany

```typescript
@Entity("users")
export class User extends BaseEntity {
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles?: Role[];
}
```

### 4. Query com Filtros Complexos

```typescript
async findWithFilters(filterDto: FilterDto) {
  const queryBuilder = this.repository.createQueryBuilder('entity');

  if (filterDto.status) {
    queryBuilder.andWhere('entity.status = :status', { status: filterDto.status });
  }

  if (filterDto.search) {
    queryBuilder.andWhere('entity.name ILIKE :search', {
      search: `%${filterDto.search}%`
    });
  }

  if (filterDto.startDate) {
    queryBuilder.andWhere('entity.created_at >= :startDate', {
      startDate: filterDto.startDate
    });
  }

  return queryBuilder
    .skip((filterDto.page - 1) * filterDto.limit)
    .take(filterDto.limit)
    .getManyAndCount();
}
```

### 5. Upload de Arquivos

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @Param('id', ParseUUIDPipe) id: string,
  @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
) {
  return this.service.uploadFile(id, file);
}
```

---

## 🎯 Boas Práticas

### Performance

- Usar `select` específico ao invés de buscar todos os campos
- Implementar índices nas colunas mais consultadas
- Usar `lazy loading` para relacionamentos grandes
- Cachear resultados frequentes

### Segurança

- Validar todos os inputs
- Sanitizar dados antes de salvar
- Excluir campos sensíveis nos DTOs de resposta
- Implementar rate limiting
- Usar UUIDs ao invés de IDs sequenciais

### Manutenibilidade

- Documentar código complexo
- Manter services com responsabilidade única
- Extrair lógica complexa para utils
- Usar constantes ao invés de valores hardcoded
- Implementar testes unitários

### Logging

- Logar operações importantes
- Incluir contexto nos logs
- Usar níveis apropriados (debug, log, warn, error)
- Não logar dados sensíveis

---

## 📚 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI](https://swagger.io/specification/)

---

**Última atualização**: Outubro 2025
**Versão**: 1.0.0
