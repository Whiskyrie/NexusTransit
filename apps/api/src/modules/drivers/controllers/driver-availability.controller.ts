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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DriverAvailabilityService } from '../services/driver-availability.service';
import { CreateDriverAvailabilityDto } from '../dto/create-driver-availability.dto';
import { UpdateDriverAvailabilityDto } from '../dto/update-driver-availability.dto';
import { DriverAvailabilityFilterDto } from '../dto/driver-availability-filter.dto';
import { DriverAvailabilityResponseDto } from '../dto/driver-availability-response.dto';
import { PaginatedResponseDto } from '@nexus/common';

@ApiTags('Driver Availability')
@Controller('drivers')
@ApiBearerAuth()
export class DriverAvailabilityController {
  constructor(private readonly availabilityService: DriverAvailabilityService) {}

  @Post(':driverId/availabilities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar período de disponibilidade/indisponibilidade',
    description:
      'Cria novo período de disponibilidade ou ausência para um motorista. Valida sobreposição de períodos.',
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Período criado com sucesso',
    type: DriverAvailabilityResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou período conflitante',
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async create(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Body() createDto: CreateDriverAvailabilityDto,
  ): Promise<DriverAvailabilityResponseDto> {
    // Adicionar driver_id ao DTO
    const dtoWithDriver = { ...createDto, driver_id: driverId };
    return this.availabilityService.create(dtoWithDriver);
  }

  @Get(':driverId/availabilities')
  @ApiOperation({
    summary: 'Listar períodos de disponibilidade de um motorista',
    description: 'Lista todos os períodos com filtros, paginação e busca',
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Itens por página (máximo 100)',
  })
  @ApiQuery({
    name: 'availability_type',
    required: false,
    description: 'Filtrar por tipo de disponibilidade',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo',
  })
  @ApiQuery({
    name: 'is_approved',
    required: false,
    type: Boolean,
    description: 'Filtrar por aprovação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de períodos',
    type: [DriverAvailabilityResponseDto],
  })
  async findAllByDriver(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query() filterDto: DriverAvailabilityFilterDto,
  ): Promise<PaginatedResponseDto<DriverAvailabilityResponseDto>> {
    return this.availabilityService.findAll({
      ...filterDto,
      driver_id: driverId,
    });
  }

  @Get('availabilities')
  @ApiOperation({
    summary: 'Listar todos os períodos de disponibilidade',
    description: 'Lista períodos de todos os motoristas com filtros avançados',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Itens por página (máximo 100)',
  })
  @ApiQuery({
    name: 'driver_id',
    required: false,
    type: String,
    description: 'Filtrar por ID do motorista',
  })
  @ApiQuery({
    name: 'availability_type',
    required: false,
    description: 'Filtrar por tipo',
  })
  @ApiQuery({
    name: 'active_on_date',
    required: false,
    type: String,
    description: 'Filtrar períodos ativos em data específica (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de períodos',
    type: [DriverAvailabilityResponseDto],
  })
  async findAll(
    @Query() filterDto: DriverAvailabilityFilterDto,
  ): Promise<PaginatedResponseDto<DriverAvailabilityResponseDto>> {
    return this.availabilityService.findAll(filterDto);
  }

  @Get('availabilities/:id')
  @ApiOperation({
    summary: 'Buscar período específico',
    description: 'Retorna detalhes completos de um período de disponibilidade',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do período',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Período encontrado',
    type: DriverAvailabilityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Período não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DriverAvailabilityResponseDto> {
    return this.availabilityService.findOne(id);
  }

  @Patch('availabilities/:id')
  @ApiOperation({
    summary: 'Atualizar período',
    description: 'Atualiza campos específicos de um período. Revalida sobreposições.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do período',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Período atualizado com sucesso',
    type: DriverAvailabilityResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou período conflitante',
  })
  @ApiNotFoundResponse({
    description: 'Período não encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDriverAvailabilityDto,
  ): Promise<DriverAvailabilityResponseDto> {
    return this.availabilityService.update(id, updateDto);
  }

  @Delete('availabilities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover período',
    description: 'Soft delete de um período de disponibilidade',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do período',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Período removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Período não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.availabilityService.remove(id);
  }

  @Post('availabilities/:id/approve')
  @ApiOperation({
    summary: 'Aprovar período de ausência',
    description: 'Aprova um período de indisponibilidade (férias, licença, etc)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do período',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Período aprovado com sucesso',
    type: DriverAvailabilityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Período não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Período já está aprovado ou não pode ser aprovado',
  })
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<DriverAvailabilityResponseDto> {
    // TODO: Obter ID do usuário autenticado do contexto
    const approvedBy = 'system'; // Placeholder
    return this.availabilityService.approve(id, approvedBy);
  }

  @Delete('availabilities/:id/approve')
  @ApiOperation({
    summary: 'Revogar aprovação de período',
    description: 'Remove a aprovação de um período de indisponibilidade',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do período',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aprovação revogada com sucesso',
    type: DriverAvailabilityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Período não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Período não está aprovado',
  })
  async revokeApproval(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DriverAvailabilityResponseDto> {
    return this.availabilityService.revokeApproval(id);
  }

  @Get(':driverId/availability/check')
  @ApiOperation({
    summary: 'Verificar disponibilidade de motorista',
    description: 'Verifica se um motorista está disponível em uma data específica',
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data para verificar (YYYY-MM-DD). Padrão: hoje',
    example: '2024-12-25',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status de disponibilidade',
    schema: {
      type: 'object',
      properties: {
        driver_id: { type: 'string', format: 'uuid' },
        date: { type: 'string', format: 'date' },
        is_available: { type: 'boolean' },
        unavailabilities: {
          type: 'array',
          items: { $ref: '#/components/schemas/DriverAvailabilityResponseDto' },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  async checkAvailability(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query('date') date?: string,
  ): Promise<{
    driver_id: string;
    date: string;
    is_available: boolean;
    unavailabilities: DriverAvailabilityResponseDto[];
  }> {
    const targetDate = date ? new Date(date) : new Date();
    const isAvailable = await this.availabilityService.isDriverAvailable(driverId, targetDate);
    const unavailabilities = await this.availabilityService.getActiveUnavailabilities(driverId);

    return {
      driver_id: driverId,
      date: targetDate.toISOString().split('T')[0],
      is_available: isAvailable,
      unavailabilities,
    };
  }
}
