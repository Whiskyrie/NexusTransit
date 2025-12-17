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
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { DriverResponseDto } from './dto/driver-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { DriverStatus } from './enums/driver-status.enum';
import { CNHCategory } from './enums/cnh-category.enum';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo motorista',
    description: 'Cria um novo motorista no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Motorista criado com sucesso',
    type: DriverResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiConflictResponse({
    description: 'CPF ou email já cadastrado',
  })
  async create(@Body() createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar motoristas',
    description: 'Retorna lista de motoristas com filtros e paginação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de motoristas retornada com sucesso',
    type: PaginatedResponseDto<DriverResponseDto>,
  })
  @ApiQuery({ name: 'status', required: false, enum: DriverStatus })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'cpf', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query() filter: DriverFilterDto,
  ): Promise<PaginatedResponseDto<DriverResponseDto>> {
    return this.driversService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar motorista por ID',
    description: 'Retorna um motorista específico pelo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Motorista encontrado',
    type: DriverResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DriverResponseDto> {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar motorista',
    description: 'Atualiza os dados de um motorista',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Motorista atualizado com sucesso',
    type: DriverResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ): Promise<DriverResponseDto> {
    return this.driversService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover motorista',
    description: 'Remove um motorista do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Motorista removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.driversService.remove(id);
  }

  // ===================================
  // Endpoints Adicionais
  // ===================================

  @Get('available')
  @ApiOperation({
    summary: 'Listar motoristas disponíveis',
    description:
      'Lista motoristas disponíveis em uma data específica, com filtros opcionais por MOPP e categoria de CNH',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data para verificar disponibilidade (YYYY-MM-DD). Padrão: hoje',
    example: '2024-12-25',
  })
  @ApiQuery({
    name: 'has_mopp',
    required: false,
    type: Boolean,
    description: 'Filtrar apenas motoristas com MOPP válido',
  })
  @ApiQuery({
    name: 'cnh_category',
    required: false,
    enum: CNHCategory,
    description: 'Filtrar por categoria de CNH',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: DriverStatus,
    description: 'Filtrar por status do motorista',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de motoristas disponíveis',
    type: [DriverResponseDto],
  })
  async findAvailable(
    @Query('date') date?: string,
    @Query('has_mopp') hasMopp?: boolean,
    @Query('cnh_category') cnhCategory?: CNHCategory,
    @Query('status') status?: DriverStatus,
  ): Promise<DriverResponseDto[]> {
    return this.driversService.findAvailableDrivers(date, {
      has_mopp: hasMopp,
      cnh_category: cnhCategory,
      status,
    });
  }

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Verificar disponibilidade de motorista',
    description: 'Verifica se um motorista específico está disponível em uma data',
  })
  @ApiParam({
    name: 'id',
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
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  async checkAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date?: string,
  ): Promise<{ driver_id: string; date: string; is_available: boolean }> {
    const targetDate = date ? new Date(date) : new Date();
    const isAvailable = await this.driversService.checkAvailability(id, targetDate);

    return {
      driver_id: id,
      date: targetDate.toISOString().split('T')[0],
      is_available: isAvailable,
    };
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Obter estatísticas do motorista',
    description:
      'Retorna estatísticas completas incluindo viagens, distância, avaliações, indisponibilidades e documentos',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas do motorista',
    schema: {
      type: 'object',
      properties: {
        driver: { $ref: '#/components/schemas/DriverResponseDto' },
        stats: {
          type: 'object',
          properties: {
            total_trips: { type: 'number' },
            total_distance: { type: 'number' },
            rating_average: { type: 'number', nullable: true },
            current_vehicle: { type: 'string', nullable: true },
            active_unavailabilities: { type: 'number' },
            pending_documents: { type: 'number' },
            expired_documents: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  async getStats(@Param('id', ParseUUIDPipe) id: string): Promise<{
    driver: DriverResponseDto;
    stats: {
      total_trips: number;
      total_distance: number;
      rating_average: number | null;
      current_vehicle?: string;
      active_unavailabilities: number;
      pending_documents: number;
      expired_documents: number;
    };
  }> {
    return this.driversService.getDriverStats(id);
  }

  @Post(':id/assign-vehicle')
  @ApiOperation({
    summary: 'Atribuir veículo a motorista',
    description: 'Atribui um veículo específico a um motorista',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo atribuído com sucesso',
    type: DriverResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Veículo inválido',
  })
  async assignVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('vehicle_id', ParseUUIDPipe) vehicleId: string,
  ): Promise<DriverResponseDto> {
    return this.driversService.assignVehicle(id, vehicleId);
  }

  @Delete(':id/assign-vehicle')
  @ApiOperation({
    summary: 'Remover atribuição de veículo',
    description: 'Remove a atribuição de veículo de um motorista',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Atribuição removida com sucesso',
    type: DriverResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Motorista não encontrado',
  })
  async unassignVehicle(@Param('id', ParseUUIDPipe) id: string): Promise<DriverResponseDto> {
    return this.driversService.unassignVehicle(id);
  }
}
