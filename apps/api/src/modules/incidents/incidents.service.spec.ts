import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident } from './entities/incident.entity';
import { IncidentAttachment } from './entities/incident-attachment.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { IncidentStatusHistory } from './entities/incident-status-history.entity';
import { StorageService } from '@nexus/storage';
import { IncidentStateMachineService } from './services/incident-state-machine.service';
import { IncidentStatus, IncidentSeverity, IncidentType } from './enums/incident.enums';
import type { CreateIncidentDto } from './dto/create-incident.dto';
import type { UpdateIncidentDto } from './dto/update-incident.dto';
import type { IncidentFilterDto } from './dto/incident-filter.dto';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let module: TestingModule;
  let _incidentRepository: Repository<Incident>;
  let _attachmentRepository: Repository<IncidentAttachment>;
  let _commentRepository: Repository<IncidentComment>;
  let _statusHistoryRepository: Repository<IncidentStatusHistory>;
  let _storageService: StorageService;
  let _stateMachineService: IncidentStateMachineService;

  const mockIncidentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAttachmentRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockCommentRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockStatusHistoryRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockStorageService = {
    uploadMultipleFiles: jest.fn(),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockStateMachineService = {
    validateTransition: jest.fn(),
    getPossibleTransitions: jest.fn(),
    transition: jest.fn().mockReturnValue({ success: true, status: IncidentStatus.INVESTIGATING }),
    canTransition: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepository,
        },
        {
          provide: getRepositoryToken(IncidentAttachment),
          useValue: mockAttachmentRepository,
        },
        {
          provide: getRepositoryToken(IncidentComment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(IncidentStatusHistory),
          useValue: mockStatusHistoryRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: IncidentStateMachineService,
          useValue: mockStateMachineService,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    _incidentRepository = module.get<Repository<Incident>>(getRepositoryToken(Incident));
    _attachmentRepository = module.get<Repository<IncidentAttachment>>(
      getRepositoryToken(IncidentAttachment),
    );
    _commentRepository = module.get<Repository<IncidentComment>>(
      getRepositoryToken(IncidentComment),
    );
    _statusHistoryRepository = module.get<Repository<IncidentStatusHistory>>(
      getRepositoryToken(IncidentStatusHistory),
    );
    _storageService = module.get<StorageService>(StorageService);
    _stateMachineService = module.get<IncidentStateMachineService>(IncidentStateMachineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('create', () => {
    it('deve criar um incidente com sucesso', async () => {
      const createDto: CreateIncidentDto = {
        incident_type: IncidentType.TRAFFIC_ACCIDENT,
        severity: IncidentSeverity.MEDIUM,
        title: 'Acidente na via',
        description: 'Colisão leve',
        delivery_id: '123e4567-e89b-12d3-a456-426614174000',
        vehicle_id: '123e4567-e89b-12d3-a456-426614174001',
        driver_id: '123e4567-e89b-12d3-a456-426614174002',
        latitude: -23.5505,
        longitude: -46.6333,
        location_address: 'São Paulo, SP',
        reported_by_user_id: '123e4567-e89b-12d3-a456-426614174003',
        impact_on_delivery: true,
        requires_insurance: false,
      };

      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        incident_number: 'INC-2025-1234',
        ...createDto,
        status: IncidentStatus.REPORTED,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockIncidentRepository.create.mockReturnValue(mockIncident);
      mockIncidentRepository.save.mockResolvedValue(mockIncident);

      const result = await service.create(createDto);

      expect(mockIncidentRepository.create).toHaveBeenCalled();
      expect(mockIncidentRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.incident_number).toContain('INC-2025');
      expect(result.status).toBe(IncidentStatus.REPORTED);
    });

    it('deve criar incidente com anexos', async () => {
      const createDto: CreateIncidentDto = {
        incident_type: IncidentType.DAMAGE,
        severity: IncidentSeverity.HIGH,
        title: 'Dano ao veículo',
        description: 'Dano grave',
        vehicle_id: '123e4567-e89b-12d3-a456-426614174001',
        reported_by_user_id: '123e4567-e89b-12d3-a456-426614174003',
      };

      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'foto.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from(''),
          stream: null as any,
          destination: '',
          filename: 'foto.jpg',
          path: '',
        },
      ];

      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        incident_number: 'INC-2025-5678',
        ...createDto,
        status: IncidentStatus.REPORTED,
        attachments: [],
      };

      const mockUploadResult = {
        url: 'https://storage.com/foto.jpg',
        filePath: 'incidents/foto.jpg',
      };

      mockIncidentRepository.create.mockReturnValue(mockIncident);
      mockIncidentRepository.save.mockResolvedValue(mockIncident);
      mockStorageService.uploadMultipleFiles.mockResolvedValue([mockUploadResult]);

      const result = await service.create(createDto, mockFiles);

      expect(mockStorageService.uploadMultipleFiles).toHaveBeenCalledWith(mockFiles, {
        fileType: 'proofs',
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de incidentes', async () => {
      const filterDto: IncidentFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockIncidents = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          title: 'Incidente 1',
          status: IncidentStatus.REPORTED,
        },
        {
          id: '2',
          incident_number: 'INC-2025-0002',
          title: 'Incidente 2',
          status: IncidentStatus.INVESTIGATING,
        },
      ];

      mockIncidentRepository.findAndCount.mockResolvedValue([mockIncidents, 2]);

      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('deve filtrar por status', async () => {
      const filterDto: IncidentFilterDto = {
        page: 1,
        limit: 10,
        status: IncidentStatus.INVESTIGATING,
      };

      const mockIncidents = [
        {
          id: '1',
          status: IncidentStatus.INVESTIGATING,
        },
      ];

      mockIncidentRepository.findAndCount.mockResolvedValue([mockIncidents, 1]);

      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(1);
      expect(mockIncidentRepository.findAndCount).toHaveBeenCalled();
    });

    it('deve retornar lista vazia se não houver incidentes', async () => {
      const filterDto: IncidentFilterDto = {
        page: 1,
        limit: 10,
      };

      mockIncidentRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('deve retornar um incidente pelo ID', async () => {
      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        incident_number: 'INC-2025-1234',
        title: 'Teste',
        status: IncidentStatus.REPORTED,
      };

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockIncident.id);
      expect(mockIncidentRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['attachments', 'comments', 'driver', 'vehicle'],
      });
    });

    it('deve lançar NotFoundException se incidente não existir', async () => {
      mockIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um incidente', async () => {
      const updateDto: UpdateIncidentDto = {
        title: 'Título atualizado',
        description: 'Descrição atualizada',
      };

      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        incident_number: 'INC-2025-1234',
        title: 'Título original',
        status: IncidentStatus.REPORTED,
      };

      const updatedIncident = {
        ...mockIncident,
        ...updateDto,
      };

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockIncidentRepository.save.mockResolvedValue(updatedIncident);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(result.description).toBe(updateDto.description);
      expect(mockIncidentRepository.save).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao atualizar incidente inexistente', async () => {
      const updateDto: UpdateIncidentDto = {
        title: 'Novo título',
      };

      mockIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.update('id-inexistente', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status com transição válida', async () => {
      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: IncidentStatus.REPORTED,
      };

      const newStatus = IncidentStatus.INVESTIGATING;

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockStateMachineService.validateTransition.mockReturnValue({
        valid: true,
        message: 'Transição válida',
      });
      mockStateMachineService.transition.mockReturnValue({
        success: true,
        status: newStatus,
      });
      mockIncidentRepository.save.mockResolvedValue({
        ...mockIncident,
        status: newStatus,
      });

      const result = await service.updateStatus('123e4567-e89b-12d3-a456-426614174000', newStatus);

      expect(result.status).toBe(newStatus);
      expect(mockStateMachineService.validateTransition).toHaveBeenCalledWith(
        IncidentStatus.REPORTED,
        newStatus,
      );
    });

    it('deve lançar BadRequestException para transição inválida', async () => {
      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: IncidentStatus.CLOSED,
      };

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockStateMachineService.validateTransition.mockImplementation(() => {
        throw new BadRequestException('Transição inválida');
      });

      await expect(
        service.updateStatus('123e4567-e89b-12d3-a456-426614174000', IncidentStatus.REPORTED),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover incidente (soft delete)', async () => {
      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        incident_number: 'INC-2025-1234',
        status: IncidentStatus.REPORTED,
      };

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockIncidentRepository.softRemove.mockResolvedValue(mockIncident);

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(mockIncidentRepository.softRemove).toHaveBeenCalledWith(mockIncident);
    });

    it('deve lançar NotFoundException ao remover incidente inexistente', async () => {
      mockIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('deve adicionar comentário a um incidente', async () => {
      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const commentText = 'Novo comentário';
      const isInternal = false;

      const mockComment = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        incident_id: mockIncident.id,
        comment_text: commentText,
        is_internal: isInternal,
      };

      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.addComment(
        '123e4567-e89b-12d3-a456-426614174000',
        commentText,
        isInternal,
      );

      expect(result).toBeDefined();
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });
  });

  describe('getStatusHistory', () => {
    it('deve retornar histórico de status', async () => {
      const mockIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockHistory = [
        {
          id: '1',
          previous_status: IncidentStatus.REPORTED,
          new_status: IncidentStatus.INVESTIGATING,
          changed_at: new Date(),
        },
        {
          id: '2',
          previous_status: IncidentStatus.INVESTIGATING,
          new_status: IncidentStatus.IN_PROGRESS,
          changed_at: new Date(),
        },
      ];

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockStatusHistoryRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getStatusHistory('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toHaveLength(2);
      expect(mockStatusHistoryRepository.find).toHaveBeenCalledWith({
        where: { incident_id: mockIncident.id },
        order: { created_at: 'DESC' },
        relations: ['changed_by_user'],
      });
    });
  });
});
