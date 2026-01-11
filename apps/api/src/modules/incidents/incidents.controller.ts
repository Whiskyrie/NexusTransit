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
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiProduces,
} from '@nestjs/swagger';

import { IncidentsService } from './incidents.service';
import { IncidentGeoService } from './services/incident-geo.service';
import { IncidentExportService } from './services/incident-export.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentFilterDto } from './dto/incident-filter.dto';
import { IncidentResponseDto } from './dto/incident-response.dto';
import { NearbyIncidentsDto } from './dto/nearby-incidents.dto';
import { WithinAreaDto } from './dto/within-area.dto';
import { IncidentWithDistanceDto } from './dto/incident-with-distance.dto';
import { PaginatedResponseDto } from '../../../../../packages/common/src/dto/paginated-response.dto';
import { IncidentStatus } from './enums/incident.enums';
import { IncidentStatusHistory } from './entities/incident-status-history.entity';
import { IncidentAttachment } from './entities/incident-attachment.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { CurrentUser } from '../users/decorators/current-user.decorator';

/**
 * Interface para o retorno de transições possíveis
 */
interface HttpResponse {
  set(headers: Record<string, string | number>): HttpResponse;
  send(body: Buffer | string): void;
  writable: boolean;
  write(chunk: unknown): boolean;
  end(): void;
}

interface PossibleTransitionsResult {
  current: IncidentStatus;
  nextStatuses: IncidentStatus[];
  transitions: {
    to: IncidentStatus;
    event: string | null;
    description: string;
  }[];
}

@ApiTags('Incidents')
@Controller('incidents')
@ApiBearerAuth()
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentGeoService: IncidentGeoService,
    private readonly exportService: IncidentExportService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo incidente',
    description: 'Cria um novo registro de incidente com anexos e comentários',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Incidente criado com sucesso',
    type: IncidentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiConflictResponse({ description: 'Conflito ao criar incidente' })
  @ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Usuário não possui permissão' })
  async create(@Body() createIncidentDto: CreateIncidentDto): Promise<IncidentResponseDto> {
    return this.incidentsService.create(createIncidentDto);
  }

  @Post('with-attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({
    summary: 'Criar incidente com anexos',
    description: 'Cria um novo incidente com upload de arquivos',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dados do incidente e arquivos',
    type: CreateIncidentDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Incidente com anexos criado com sucesso',
    type: IncidentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou arquivos não fornecidos' })
  @ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' })
  async createWithAttachments(
    @Body() createIncidentDto: CreateIncidentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.create(createIncidentDto, files);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar incidentes',
    description: 'Lista incidentes com filtros, paginação e busca',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de incidentes',
    type: PaginatedResponseDto<IncidentResponseDto>,
  })
  async findAll(
    @Query() filterDto: IncidentFilterDto,
  ): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    return this.incidentsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar incidente por ID',
    description: 'Retorna detalhes completos do incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incidente encontrado',
    type: IncidentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentResponseDto> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar incidente',
    description: 'Atualiza campos específicos do incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incidente atualizado com sucesso',
    type: IncidentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Patch(':id/with-attachments')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({
    summary: 'Atualizar incidente com novos anexos',
    description: 'Atualiza incidente e adiciona novos arquivos',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incidente atualizado com anexos',
    type: IncidentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async updateWithAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.update(id, updateIncidentDto, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover incidente',
    description: 'Soft delete do incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Incidente removido com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.incidentsService.remove(id);
  }

  @Get(':id/attachments')
  @ApiOperation({
    summary: 'Listar anexos do incidente',
    description: 'Retorna todos os anexos associados ao incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de anexos do incidente',
    type: [IncidentAttachment],
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async getAttachments(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentAttachment[]> {
    return this.incidentsService.getAttachments(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary: 'Adicionar anexo a incidente',
    description: 'Faz upload de um arquivo e associa ao incidente',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Anexo adicionado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('description') description?: string,
    @CurrentUser('id') userId?: string,
  ): Promise<IncidentAttachment[]> {
    return this.incidentsService.addAttachments(id, files, description, userId);
  }

  @Get(':id/comments')
  @ApiOperation({
    summary: 'Listar comentários do incidente',
    description: 'Retorna todos os comentários associados ao incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de comentários do incidente',
    type: [IncidentComment],
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async getComments(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentComment[]> {
    return this.incidentsService.getComments(id);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Adicionar comentário a incidente',
    description: 'Adiciona um comentário ao incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comentário adicionado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comment_text') commentText: string,
    @Body('is_internal') isInternal = false,
    @CurrentUser('id') userId?: string,
  ): Promise<IncidentComment> {
    return this.incidentsService.addComment(id, commentText, isInternal, userId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do incidente',
    description: 'Altera o status do incidente e registra data de resolução se aplicável',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status atualizado com sucesso',
    type: IncidentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: IncidentStatus,
    @Body('resolution_notes') resolutionNotes?: string,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.updateStatus(id, status, resolutionNotes);
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Atribuir incidente a usuário',
    description: 'Atribui um usuário responsável pelo incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incidente atribuído com sucesso',
    type: IncidentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async assignIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('user_id') userId: string,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.assignIncident(id, userId);
  }

  @Get(':id/status-history')
  @ApiOperation({
    summary: 'Obter histórico de status',
    description: 'Retorna o histórico completo de mudanças de status do incidente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histórico de status do incidente',
    type: [IncidentStatusHistory],
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async getStatusHistory(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentStatusHistory[]> {
    return this.incidentsService.getStatusHistory(id);
  }

  @Get(':id/possible-transitions')
  @ApiOperation({
    summary: 'Obter transições possíveis',
    description: 'Retorna os próximos status possíveis a partir do status atual',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transições de status disponíveis',
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async getPossibleTransitions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PossibleTransitionsResult> {
    return this.incidentsService.getPossibleTransitions(id);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar incidentes próximos',
    description:
      'Busca incidentes dentro de um raio de distância de uma localização usando PostGIS ST_DWithin',
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    type: Number,
    example: -23.5505,
    description: 'Latitude da localização de referência',
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    type: Number,
    example: -46.6333,
    description: 'Longitude da localização de referência',
  })
  @ApiQuery({
    name: 'radius_meters',
    required: false,
    type: Number,
    example: 5000,
    description: 'Raio de busca em metros (padrão: 5000)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IncidentStatus,
    description: 'Filtrar por status do incidente',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Limite de resultados (padrão: 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de incidentes próximos ordenados por distância',
    type: [IncidentWithDistanceDto],
  })
  @ApiBadRequestResponse({ description: 'Parâmetros inválidos' })
  async findNearby(@Query() dto: NearbyIncidentsDto): Promise<IncidentWithDistanceDto[]> {
    return this.incidentGeoService.findNearby(dto);
  }

  @Post('within-area')
  @ApiOperation({
    summary: 'Buscar incidentes dentro de área',
    description: 'Busca incidentes dentro de um polígono usando PostGIS ST_Within',
  })
  @ApiBody({
    type: WithinAreaDto,
    description: 'Coordenadas do polígono e filtros opcionais',
    examples: {
      'area-sao-paulo': {
        summary: 'Área em São Paulo',
        value: {
          coordinates: [
            { latitude: -23.5505, longitude: -46.6333 },
            { latitude: -23.5605, longitude: -46.6333 },
            { latitude: -23.5605, longitude: -46.6233 },
            { latitude: -23.5505, longitude: -46.6233 },
            { latitude: -23.5505, longitude: -46.6333 },
          ],
          status: 'REPORTED',
          limit: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de incidentes dentro da área especificada',
    type: [IncidentResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Polígono inválido ou parâmetros incorretos' })
  async findWithinArea(@Body() dto: WithinAreaDto): Promise<IncidentResponseDto[]> {
    return this.incidentGeoService.findWithinArea(dto);
  }

  @Get('export/csv')
  @ApiOperation({
    summary: 'Exportar incidentes em CSV',
    description: 'Exporta dados de incidentes em formato CSV com filtros opcionais',
  })
  @ApiProduces('text/csv')
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IncidentStatus,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Data inicial (ISO 8601)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'Data final (ISO 8601)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Arquivo CSV gerado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Nenhum incidente encontrado' })
  async exportCSV(@Query() filterDto: IncidentFilterDto, @Res() res: HttpResponse): Promise<void> {
    const buffer = await this.exportService.exportToCSV(filterDto);

    const filename = `incidents_${new Date().toISOString().split('T')[0]}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('export/pdf/:id')
  @ApiOperation({
    summary: 'Exportar incidente específico em PDF',
    description: 'Gera relatório PDF detalhado de um incidente específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do incidente',
    type: String,
    format: 'uuid',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF gerado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Incidente não encontrado' })
  async exportIncidentPDF(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: HttpResponse,
  ): Promise<void> {
    const pdfStream = await this.exportService.exportIncidentToPDF(id);

    const filename = `incident_${id}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    pdfStream.on('data', (chunk: Buffer) => res.write(chunk));
    pdfStream.on('end', () => res.end());
  }

  @Get('export/pdf')
  @ApiOperation({
    summary: 'Exportar incidentes consolidados em PDF',
    description: 'Gera relatório PDF consolidado com múltiplos incidentes',
  })
  @ApiProduces('application/pdf')
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IncidentStatus,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Data inicial (ISO 8601)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'Data final (ISO 8601)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF consolidado gerado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Nenhum incidente encontrado' })
  async exportConsolidatedPDF(
    @Query() filterDto: IncidentFilterDto,
    @Res() res: HttpResponse,
  ): Promise<void> {
    const pdfStream = await this.exportService.exportIncidentsToPDF(filterDto);

    const filename = `incidents_report_${new Date().toISOString().split('T')[0]}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    pdfStream.on('data', (chunk: Buffer) => res.write(chunk));
    pdfStream.on('end', () => res.end());
  }
}
