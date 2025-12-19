import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentFilterDto } from './dto/incident-filter.dto';
import { IncidentResponseDto } from './dto/incident-response.dto';
import { Incident } from './entities/incident.entity';
import { IncidentAttachment, IncidentAttachmentType } from './entities/incident-attachment.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { IncidentStatusHistory } from './entities/incident-status-history.entity';
import {
  IncidentStatus,
  translateIncidentSeverity,
  translateIncidentStatus,
  translateIncidentType,
} from './enums/incident.enums';
import { PaginatedResponseDto } from '@nexus/common';
import { StorageService } from '@nexus/storage';
import { IncidentStateMachineService } from './services/incident-state-machine.service';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(IncidentAttachment)
    private readonly attachmentRepository: Repository<IncidentAttachment>,
    @InjectRepository(IncidentComment)
    private readonly commentRepository: Repository<IncidentComment>,
    @InjectRepository(IncidentStatusHistory)
    private readonly statusHistoryRepository: Repository<IncidentStatusHistory>,
    private readonly storageService: StorageService,
    private readonly stateMachineService: IncidentStateMachineService,
  ) {}

  /**
   * Gerar número único de incidente
   */
  private generateIncidentNumber(): string {
    const prefix = 'INC';
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${randomDigits}`;
  }

  /**
   * Criar novo incidente
   */
  async create(
    createIncidentDto: CreateIncidentDto,
    files: Express.Multer.File[] = [],
  ): Promise<IncidentResponseDto> {
    // Gerar número único do incidente
    const incidentNumber = this.generateIncidentNumber();

    // Preparar localização PostGIS se latitude e longitude forem fornecidos
    let location: string | undefined;
    if (createIncidentDto.latitude && createIncidentDto.longitude) {
      location = `POINT(${createIncidentDto.longitude} ${createIncidentDto.latitude})`;
    }

    // Criar incidente base
    const incident = this.incidentRepository.create({
      incident_number: incidentNumber,
      incident_type: createIncidentDto.incident_type,
      severity: createIncidentDto.severity,
      title: createIncidentDto.title,
      description: createIncidentDto.description,
      delivery_id: createIncidentDto.delivery_id,
      vehicle_id: createIncidentDto.vehicle_id,
      driver_id: createIncidentDto.driver_id,
      route_id: createIncidentDto.route_id,
      location,
      location_address: createIncidentDto.location_address,
      occurred_at: createIncidentDto.occurred_at
        ? new Date(createIncidentDto.occurred_at)
        : undefined,
      reported_by_user_id: createIncidentDto.reported_by_user_id,
      estimated_loss: createIncidentDto.estimated_loss,
      impact_on_delivery: createIncidentDto.impact_on_delivery ?? false,
      requires_insurance: createIncidentDto.requires_insurance ?? false,
      notes: createIncidentDto.notes,
      status: IncidentStatus.REPORTED,
    });

    // Salvar incidente
    const savedIncident = await this.incidentRepository.save(incident);

    // Processar anexos
    if (files && files.length > 0) {
      const attachments = await this.processAttachments(
        files,
        savedIncident.id,
        createIncidentDto.attachments,
      );
      savedIncident.attachments = attachments;
    }

    // Processar comentários
    if (createIncidentDto.comments && createIncidentDto.comments.length > 0) {
      const comments = this.processComments(createIncidentDto.comments, savedIncident.id);
      savedIncident.comments = comments;
    }

    // Atualizar incidente com anexos e comentários
    await this.incidentRepository.save(savedIncident);

    this.logger.log(`Incidente criado: ${savedIncident.id}`);

    return this.mapToResponseDto(savedIncident);
  }

  /**
   * Processar anexos de arquivo
   */
  private async processAttachments(
    files: Express.Multer.File[],
    incidentId: string,
    attachmentDtos?: { description?: string }[],
  ): Promise<IncidentAttachment[]> {
    const uploadResults = await this.storageService.uploadMultipleFiles(files, 'incidents');

    return uploadResults.map((result, index) => {
      const attachment = new IncidentAttachment();
      attachment.incident_id = incidentId;
      attachment.file_type = this.getAttachmentType(result.filePath);
      attachment.file_url = result.url;
      attachment.file_name = result.filePath.split('/').pop() ?? '';
      attachment.file_size = files[index].size;
      attachment.mime_type = files[index].mimetype;
      attachment.description = attachmentDtos?.[index]?.description;
      attachment.uploaded_by_user_id = 'system'; // Será substituído pelo usuário autenticado
      return attachment;
    });
  }

  /**
   * Determinar tipo de anexo com base na extensão
   */
  private getAttachmentType(filename: string): IncidentAttachmentType {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension ?? '')) {
      return IncidentAttachmentType.PHOTO;
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension ?? '')) {
      return IncidentAttachmentType.VIDEO;
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension ?? '')) {
      return IncidentAttachmentType.AUDIO;
    }
    return IncidentAttachmentType.DOCUMENT;
  }

  /**
   * Processar comentários
   */
  private processComments(
    commentDtos: { comment_text: string; is_internal?: boolean }[],
    incidentId: string,
  ): IncidentComment[] {
    return commentDtos.map(dto => {
      const comment = new IncidentComment();
      comment.incident_id = incidentId;
      comment.comment_text = dto.comment_text;
      comment.is_internal = dto.is_internal ?? false;
      comment.user_id = 'system'; // Será substituído pelo usuário autenticado
      return comment;
    });
  }

  /**
   * Listar incidentes com filtros
   */
  async findAll(filterDto: IncidentFilterDto): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    const { page = 1, limit = 10, search, ...filters } = filterDto;

    // Construir where clause
    const where: FindOptionsWhere<Incident> = {};

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (filters.incident_type) {
      where.incident_type = filters.incident_type;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.delivery_id) {
      where.delivery_id = filters.delivery_id;
    }

    if (filters.vehicle_id) {
      where.vehicle_id = filters.vehicle_id;
    }

    if (filters.driver_id) {
      where.driver_id = filters.driver_id;
    }

    if (filters.route_id) {
      where.route_id = filters.route_id;
    }

    if (filters.reported_by_user_id) {
      where.reported_by_user_id = filters.reported_by_user_id;
    }

    if (filters.assigned_to_user_id) {
      where.assigned_to_user_id = filters.assigned_to_user_id;
    }

    if (filters.start_date || filters.end_date) {
      if (filters.start_date) {
        where.reported_at = MoreThanOrEqual(new Date(filters.start_date));
      }
      if (filters.end_date) {
        where.reported_at = LessThanOrEqual(new Date(filters.end_date));
      }
    }

    if (filters.impact_on_delivery !== undefined) {
      where.impact_on_delivery = filters.impact_on_delivery;
    }

    if (filters.requires_insurance !== undefined) {
      where.requires_insurance = filters.requires_insurance;
    }

    // Executar query com paginação
    const [incidents, total] = await this.incidentRepository.findAndCount({
      where,
      relations: ['attachments', 'comments'],
      take: limit,
      skip: (page - 1) * limit,
      order: { reported_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: incidents.map(incident => this.mapToResponseDto(incident)),
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

  /**
   * Buscar incidente por ID
   */
  async findOne(id: string): Promise<IncidentResponseDto> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['attachments', 'comments'],
    });

    if (!incident) {
      throw new NotFoundException(`Incidente com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(incident);
  }

  /**
   * Atualizar incidente
   */
  async update(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
    files: Express.Multer.File[] = [],
  ): Promise<IncidentResponseDto> {
    const incident = await this.findIncidentOrFail(id);

    // Atualizar campos principais
    Object.assign(incident, updateIncidentDto);

    // Processar novos anexos
    if (files && files.length > 0) {
      const existingAttachments = incident.attachments ?? [];
      const newAttachments = await this.processAttachments(
        files,
        incident.id,
        updateIncidentDto.attachments,
      );
      await this.attachmentRepository.save(newAttachments);
      incident.attachments = [...existingAttachments, ...newAttachments];
    }

    // Processar novos comentários
    if (updateIncidentDto.comments && updateIncidentDto.comments.length > 0) {
      const existingComments = incident.comments ?? [];
      const newComments = this.processComments(updateIncidentDto.comments, incident.id);
      await this.commentRepository.save(newComments);
      incident.comments = [...existingComments, ...newComments];
    }

    // Salvar alterações
    const updated = await this.incidentRepository.save(incident);

    this.logger.log(`Incidente atualizado: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remover incidente (soft delete)
   */
  async remove(id: string): Promise<void> {
    const incident = await this.findIncidentOrFail(id);

    await this.incidentRepository.softRemove(incident);

    this.logger.log(`Incidente removido: ${id}`);
  }

  /**
   * Adicionar anexo a incidente existente
   */
  async addAttachment(
    incidentId: string,
    file: Express.Multer.File,
    description?: string,
  ): Promise<IncidentAttachment> {
    const uploadResult = await this.storageService.uploadFile(file, 'incidents');

    const attachment = new IncidentAttachment();
    attachment.incident_id = incidentId;
    attachment.file_type = this.getAttachmentType(uploadResult.filePath);
    attachment.file_url = uploadResult.url;
    attachment.file_name = uploadResult.filePath.split('/').pop() ?? '';
    attachment.file_size = file.size;
    attachment.mime_type = file.mimetype;
    attachment.description = description;
    attachment.uploaded_by_user_id = 'system'; // Será substituído pelo usuário autenticado

    const savedAttachment = await this.attachmentRepository.save(attachment);

    this.logger.log(`Anexo adicionado ao incidente ${incidentId}: ${savedAttachment.id}`);

    return savedAttachment;
  }

  /**
   * Adicionar comentário a incidente existente
   */
  async addComment(
    incidentId: string,
    commentText: string,
    isInternal = false,
  ): Promise<IncidentComment> {
    const comment = new IncidentComment();
    comment.incident_id = incidentId;
    comment.comment_text = commentText;
    comment.is_internal = isInternal;
    comment.user_id = 'system'; // Será substituído pelo usuário autenticado

    const savedComment = await this.commentRepository.save(comment);

    this.logger.log(`Comentário adicionado ao incidente ${incidentId}: ${savedComment.id}`);

    return savedComment;
  }

  /**
   * Atualizar status do incidente com validação de máquina de estados
   */
  async updateStatus(
    id: string,
    status: IncidentStatus,
    resolutionNotes?: string,
    userId?: string,
    reason?: string,
  ): Promise<IncidentResponseDto> {
    const incident = await this.findIncidentOrFail(id);
    const currentStatus = incident.status;

    // Se o status não mudou, não fazer nada
    if (currentStatus === status) {
      return this.mapToResponseDto(incident);
    }

    // Validar a transição usando a máquina de estados
    const validation = this.stateMachineService.validateTransition(currentStatus, status);

    if (!validation.valid) {
      throw new BadRequestException(validation.message ?? 'Transição de status inválida');
    }

    // Executar a transição através da máquina de estados
    const transitionResult = this.stateMachineService.transition(
      id,
      currentStatus,
      status,
      userId ?? incident.reported_by_user_id,
      reason ?? resolutionNotes,
    );

    // Atualizar o incidente
    incident.status = transitionResult.status;

    if (status === IncidentStatus.RESOLVED) {
      incident.resolved_at = new Date();
      incident.resolution_notes = resolutionNotes;
    }

    if (status === IncidentStatus.CLOSED) {
      incident.resolved_at = incident.resolved_at ?? new Date();
    }

    const updated = await this.incidentRepository.save(incident);

    this.logger.log(
      `Status do incidente atualizado: ${id} (${currentStatus} -> ${status}) por ${userId ?? 'sistema'}`,
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Obter histórico de mudanças de status
   */
  async getStatusHistory(id: string): Promise<IncidentStatusHistory[]> {
    const incident = await this.findIncidentOrFail(id);

    const history = await this.statusHistoryRepository.find({
      where: { incident_id: incident.id },
      order: { created_at: 'DESC' },
      relations: ['changed_by_user'],
    });

    return history;
  }

  /**
   * Obter transições possíveis a partir do status atual
   */
  async getPossibleTransitions(id: string): Promise<{
    current: IncidentStatus;
    nextStatuses: IncidentStatus[];
    transitions: {
      to: IncidentStatus;
      event: string | null;
      description: string;
    }[];
  }> {
    const incident = await this.findIncidentOrFail(id);
    return this.stateMachineService.getTransitionInfo(incident.status);
  }

  /**
   * Atualizar usuário responsável pelo incidente
   */
  async assignIncident(id: string, userId: string): Promise<IncidentResponseDto> {
    const incident = await this.findIncidentOrFail(id);

    incident.assigned_to_user_id = userId;
    incident.status = IncidentStatus.INVESTIGATING;

    const updated = await this.incidentRepository.save(incident);

    this.logger.log(`Incidente atribuído a usuário ${userId}: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Métodos auxiliares privados
   */
  private async findIncidentOrFail(id: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['attachments', 'comments'],
    });

    if (!incident) {
      throw new NotFoundException(`Incidente com ID ${id} não encontrado`);
    }

    return incident;
  }

  /**
   * Mapear entidade para DTO de resposta
   */
  private mapToResponseDto(incident: Incident): IncidentResponseDto {
    const dto = new IncidentResponseDto();

    // Mapear campos básicos
    Object.assign(dto, incident);

    // Adicionar traduções
    if (incident.incident_type) {
      dto.incident_type_translated = translateIncidentType(incident.incident_type);
    }
    if (incident.severity) {
      dto.severity_translated = translateIncidentSeverity(incident.severity);
    }
    if (incident.status) {
      dto.status_translated = translateIncidentStatus(incident.status);
    }

    return dto;
  }
}
