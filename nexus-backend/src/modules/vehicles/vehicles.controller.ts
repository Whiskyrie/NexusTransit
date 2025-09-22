import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { UploadDocumentDto, DocumentResponseDto } from './dto/document.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { VehicleStatus } from './enums/vehicle-status.enum';
import { VehicleType } from './enums/vehicle-type.enum';

@ApiTags('Vehicles')
@Controller('vehicles')
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo veículo',
    description: 'Cria um novo veículo na frota com validações completas de placa brasileira',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Veículo criado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiConflictResponse({
    description: 'Placa já existe no sistema',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para criar veículos',
  })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar veículos',
    description: 'Lista veículos com filtros avançados, paginação e busca',
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
    name: 'status',
    required: false,
    enum: VehicleStatus,
    description: 'Filtrar por status do veículo',
  })
  @ApiQuery({
    name: 'vehicle_type',
    required: false,
    enum: VehicleType,
    description: 'Filtrar por tipo do veículo',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por placa, marca ou modelo',
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    type: String,
    description: 'Filtrar por marca específica',
  })
  @ApiQuery({
    name: 'needs_maintenance',
    required: false,
    type: Boolean,
    description: 'Filtrar veículos que precisam de manutenção',
  })
  @ApiQuery({
    name: 'order_by',
    required: false,
    type: String,
    enum: ['created_at', 'updated_at', 'license_plate', 'brand', 'model', 'year'],
    description: 'Campo para ordenação',
  })
  @ApiQuery({
    name: 'order_direction',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Direção da ordenação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos com paginação',
    type: PaginatedResponseDto<VehicleResponseDto>,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findAll(
    @Query() filter: VehicleFilterDto,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    return this.vehiclesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar veículo por ID',
    description: 'Retorna detalhes completos de um veículo específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo encontrado',
    type: VehicleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'ID fornecido não é um UUID válido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleResponseDto> {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar veículo',
    description: 'Atualiza dados de um veículo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo atualizado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiConflictResponse({
    description: 'Placa já existe em outro veículo',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para atualizar veículos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover veículo',
    description: 'Remove um veículo do sistema (exclusão lógica)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Veículo removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'ID fornecido não é um UUID válido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para remover veículos',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehiclesService.remove(id);
  }

  @Post(':id/documents')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      fileFilter: (req, file, callback) => {
        if (!/\.(pdf|jpg|jpeg|png|doc|docx)$/i.exec(file.originalname)) {
          return callback(
            new Error('Apenas arquivos PDF, JPG, PNG, DOC e DOCX são permitidos'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por arquivo
        files: 10, // máximo 10 arquivos
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de documentos do veículo',
    description: 'Faz upload de documentos relacionados ao veículo (CRLV, seguro, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Documentos enviados com sucesso',
    type: [DocumentResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Arquivos inválidos ou dados incorretos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para fazer upload de documentos',
  })
  async uploadDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDocumentDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto[]> {
    return this.vehiclesService.uploadDocuments(id, files, uploadDocumentDto);
  }

  @Get(':id/documents')
  @ApiOperation({
    summary: 'Listar documentos do veículo',
    description: 'Lista todos os documentos associados ao veículo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de documentos do veículo',
    type: [DocumentResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getDocuments(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto[]> {
    return this.vehiclesService.getDocuments(id);
  }

  @Patch(':vehicleId/documents/:documentId')
  @ApiOperation({
    summary: 'Atualizar documento do veículo',
    description: 'Atualiza informações de um documento específico',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID único do documento',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento atualizado com sucesso',
    type: DocumentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo ou documento não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para atualizar documentos',
  })
  async updateDocument(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() updateData: Partial<UploadDocumentDto>,
  ): Promise<DocumentResponseDto> {
    return this.vehiclesService.updateDocument(vehicleId, documentId, updateData);
  }

  @Delete(':vehicleId/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover documento do veículo',
    description: 'Remove um documento específico do veículo',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID único do documento',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Documento removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Veículo ou documento não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para remover documentos',
  })
  async removeDocument(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    return this.vehiclesService.removeDocument(vehicleId, documentId);
  }
}
