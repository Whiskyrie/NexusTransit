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
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { DriverStatus } from './enums/driver-status.enum';

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
}
