import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
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
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleFilterDto,
  VehicleResponseDto,
  UploadDocumentDto,
  DocumentResponseDto,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  CompleteMaintenanceDto,
  MaintenanceResponseDto,
  AlertSummaryDto,
} from './dto';
import { PaginatedResponseDto } from '@nexus/common';
import { VehicleStatus, VehicleType, LicensePlateType } from './enums';

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
    name: 'license_plate_type',
    required: false,
    enum: LicensePlateType,
    description: 'Filtrar por tipo de formato da placa',
  })
  @ApiQuery({
    name: 'insurance_expiring',
    required: false,
    type: Boolean,
    description: 'Mostrar apenas veículos com seguro próximo ao vencimento',
  })
  @ApiQuery({
    name: 'license_expiring',
    required: false,
    type: Boolean,
    description: 'Mostrar apenas veículos com licenciamento próximo ao vencimento',
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

  @Put(':id')
  @ApiOperation({
    summary: 'Substituir veículo',
    description: 'Substitui completamente um veículo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo substituído com sucesso',
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
    description: 'Usuário não possui permissão para substituir veículos',
  })
  async replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.replace(id, createVehicleDto);
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

  @Get('documents/expiring')
  @ApiOperation({
    summary: 'Listar documentos próximos ao vencimento',
    description: 'Lista documentos que estão próximos ao vencimento (padrão: 30 dias)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 30,
    description: 'Número de dias para considerar documentos próximos ao vencimento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de documentos próximos ao vencimento',
    type: [DocumentResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getExpiringDocuments(@Query('days') days = 30): Promise<DocumentResponseDto[]> {
    return this.vehiclesService.getExpiringDocuments(days);
  }

  @Get('documents/expired')
  @ApiOperation({
    summary: 'Listar documentos vencidos',
    description: 'Lista documentos que já estão vencidos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de documentos vencidos',
    type: [DocumentResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getExpiredDocuments(): Promise<DocumentResponseDto[]> {
    return this.vehiclesService.getExpiredDocuments();
  }

  @Post(':id/maintenances')
  @ApiOperation({
    summary: 'Agendar manutenção para veículo',
    description: 'Cria um novo registro de manutenção para um veículo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Manutenção agendada com sucesso',
    type: MaintenanceResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para agendar manutenções',
  })
  async createMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMaintenanceDto: CreateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.vehiclesService.createMaintenance(id, createMaintenanceDto);
  }

  @Get(':id/maintenances')
  @ApiOperation({
    summary: 'Listar histórico de manutenções do veículo',
    description: 'Retorna o histórico completo de manutenções de um veículo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histórico de manutenções',
    type: [MaintenanceResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getMaintenances(@Param('id', ParseUUIDPipe) id: string): Promise<MaintenanceResponseDto[]> {
    return this.vehiclesService.getMaintenances(id);
  }

  @Patch(':vehicleId/maintenances/:maintenanceId')
  @ApiOperation({
    summary: 'Atualizar manutenção',
    description: 'Atualiza informações de uma manutenção existente',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'maintenanceId',
    description: 'ID único da manutenção',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Manutenção atualizada com sucesso',
    type: MaintenanceResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo ou manutenção não encontrados',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para atualizar manutenções',
  })
  async updateMaintenance(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('maintenanceId', ParseUUIDPipe) maintenanceId: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.vehiclesService.updateMaintenance(vehicleId, maintenanceId, updateMaintenanceDto);
  }

  @Post(':vehicleId/maintenances/:maintenanceId/complete')
  @ApiOperation({
    summary: 'Concluir manutenção',
    description: 'Marca uma manutenção como concluída e adiciona avaliação',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'maintenanceId',
    description: 'ID único da manutenção',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Manutenção concluída com sucesso',
    type: MaintenanceResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo ou manutenção não encontrados',
  })
  @ApiBadRequestResponse({
    description: 'Não é possível concluir manutenção com status atual',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para concluir manutenções',
  })
  async completeMaintenance(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('maintenanceId', ParseUUIDPipe) maintenanceId: string,
    @Body() completeMaintenanceDto: CompleteMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    return this.vehiclesService.completeMaintenance(
      vehicleId,
      maintenanceId,
      completeMaintenanceDto,
    );
  }

  @Delete(':vehicleId/maintenances/:maintenanceId')
  @ApiOperation({
    summary: 'Cancelar manutenção',
    description: 'Cancela uma manutenção agendada ou em andamento',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'ID único do veículo',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'maintenanceId',
    description: 'ID único da manutenção',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Manutenção cancelada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Veículo ou manutenção não encontrados',
  })
  @ApiBadRequestResponse({
    description: 'Não é possível cancelar manutenção concluída',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para cancelar manutenções',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelMaintenance(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('maintenanceId', ParseUUIDPipe) maintenanceId: string,
  ): Promise<void> {
    return this.vehiclesService.cancelMaintenance(vehicleId, maintenanceId);
  }

  @Get('maintenances/scheduled')
  @ApiOperation({
    summary: 'Listar manutenções agendadas',
    description: 'Retorna todas as manutenções agendadas para o futuro',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de manutenções agendadas',
    type: [MaintenanceResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getScheduledMaintenances(): Promise<MaintenanceResponseDto[]> {
    return this.vehiclesService.getScheduledMaintenances();
  }

  @Get('maintenances/overdue')
  @ApiOperation({
    summary: 'Listar manutenções atrasadas',
    description: 'Retorna todas as manutenções que estão atrasadas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de manutenções atrasadas',
    type: [MaintenanceResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getOverdueMaintenances(): Promise<MaintenanceResponseDto[]> {
    return this.vehiclesService.getOverdueMaintenances();
  }

  @Get('alerts/maintenance')
  @ApiOperation({
    summary: 'Verificar alertas de manutenção',
    description: 'Retorna veículos que precisam de manutenção nos próximos 30 dias',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos com alertas de manutenção',
    type: [VehicleResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async checkMaintenanceAlerts(): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.checkMaintenanceAlerts();
  }

  @Get('alerts/documents')
  @ApiOperation({
    summary: 'Verificar alertas de documentos',
    description: 'Retorna veículos com documentos próximos ao vencimento ou vencidos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos com alertas de documentos',
    type: [VehicleResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async checkDocumentAlerts(): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.checkDocumentAlerts();
  }

  @Get('alerts/summary')
  @ApiOperation({
    summary: 'Resumo de alertas',
    description: 'Retorna um resumo consolidado de todos os alertas ativos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumo de alertas',
    type: Object,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getAlertsSummary(): Promise<AlertSummaryDto> {
    return this.vehiclesService.getAlertsSummary();
  }
}
