import { Test, type TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentGeoService } from './services/incident-geo.service';
import { IncidentExportService } from './services/incident-export.service';
import type { CreateIncidentDto } from './dto/create-incident.dto';
import type { UpdateIncidentDto } from './dto/update-incident.dto';
import type { IncidentFilterDto } from './dto/incident-filter.dto';
import type { NearbyIncidentsDto } from './dto/nearby-incidents.dto';
import { IncidentStatus, IncidentSeverity, IncidentType } from './enums/incident.enums';
import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

describe('IncidentsController', () => {
  let controller: IncidentsController;
  let _incidentsService: IncidentsService;
  let _geoService: IncidentGeoService;
  let _exportService: IncidentExportService;

  const mockIncidentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
    addAttachment: jest.fn(),
    addComment: jest.fn(),
    getStatusHistory: jest.fn(),
    assignIncident: jest.fn(),
  };

  const mockGeoService = {
    findNearby: jest.fn(),
    findWithinArea: jest.fn(),
    calculateDistance: jest.fn(),
    getIncidentDensityMap: jest.fn(),
  };

  const mockExportService = {
    exportToCSV: jest.fn(),
    exportIncidentToPDF: jest.fn(),
    exportIncidentsToPDF: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        {
          provide: IncidentsService,
          useValue: mockIncidentsService,
        },
        {
          provide: IncidentGeoService,
          useValue: mockGeoService,
        },
        {
          provide: IncidentExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
    _incidentsService = module.get<IncidentsService>(IncidentsService);
    _geoService = module.get<IncidentGeoService>(IncidentGeoService);
    _exportService = module.get<IncidentExportService>(IncidentExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar incidente com sucesso', async () => {
      const createDto: CreateIncidentDto = {
        incident_type: IncidentType.TRAFFIC_ACCIDENT,
        severity: IncidentSeverity.MEDIUM,
        title: 'Acidente na via',
        description: 'Colisão leve',
        vehicle_id: '123e4567-e89b-12d3-a456-426614174001',
        reported_by_user_id: '123e4567-e89b-12d3-a456-426614174003',
      };

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        incident_number: 'INC-2025-1234',
        ...createDto,
        status: IncidentStatus.REPORTED,
      };

      mockIncidentsService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(result.incident_number).toBe('INC-2025-1234');
      expect(mockIncidentsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de incidentes', async () => {
      const filterDto: IncidentFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [
          {
            id: '1',
            incident_number: 'INC-2025-0001',
            title: 'Incidente 1',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
          has_previous: false,
          has_next: false,
        },
      };

      mockIncidentsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(filterDto);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(mockIncidentsService.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('deve retornar incidente por ID', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockIncident = {
        id: incidentId,
        incident_number: 'INC-2025-0001',
        title: 'Teste',
      };

      mockIncidentsService.findOne.mockResolvedValue(mockIncident);

      const result = await controller.findOne(incidentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(incidentId);
      expect(mockIncidentsService.findOne).toHaveBeenCalledWith(incidentId);
    });

    it('deve propagar NotFoundException', async () => {
      mockIncidentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar incidente', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto: UpdateIncidentDto = {
        title: 'Título atualizado',
      };

      const mockUpdated = {
        id: incidentId,
        ...updateDto,
      };

      mockIncidentsService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(incidentId, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(mockIncidentsService.update).toHaveBeenCalledWith(incidentId, updateDto);
    });
  });

  describe('remove', () => {
    it('deve remover incidente', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';

      mockIncidentsService.remove.mockResolvedValue(undefined);

      await controller.remove(incidentId);

      expect(mockIncidentsService.remove).toHaveBeenCalledWith(incidentId);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status do incidente', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = IncidentStatus.INVESTIGATING;
      const resolutionNotes = 'Investigação iniciada';

      const mockUpdated = {
        id: incidentId,
        status: newStatus,
      };

      mockIncidentsService.updateStatus.mockResolvedValue(mockUpdated);

      const result = await controller.updateStatus(incidentId, newStatus, resolutionNotes);

      expect(result.status).toBe(newStatus);
      expect(mockIncidentsService.updateStatus).toHaveBeenCalledWith(
        incidentId,
        newStatus,
        resolutionNotes,
      );
    });
  });

  describe('findNearby', () => {
    it('deve buscar incidentes próximos', async () => {
      const dto: NearbyIncidentsDto = {
        latitude: -23.5505,
        longitude: -46.6333,
        radius_meters: 5000,
      };

      const mockResults = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          distance_meters: 150,
        },
      ];

      mockGeoService.findNearby.mockResolvedValue(mockResults);

      const result = await controller.findNearby(dto);

      expect(result).toHaveLength(1);
      expect(mockGeoService.findNearby).toHaveBeenCalledWith(dto);
    });
  });

  describe('getStatusHistory', () => {
    it('deve retornar histórico de status', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';

      const mockHistory = [
        {
          id: '1',
          previous_status: IncidentStatus.REPORTED,
          new_status: IncidentStatus.INVESTIGATING,
          changed_at: new Date(),
        },
      ];

      mockIncidentsService.getStatusHistory.mockResolvedValue(mockHistory);

      const result = await controller.getStatusHistory(incidentId);

      expect(result).toHaveLength(1);
      expect(mockIncidentsService.getStatusHistory).toHaveBeenCalledWith(incidentId);
    });
  });

  describe('addComment', () => {
    it('deve adicionar comentário ao incidente', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';
      const commentText = 'Novo comentário';
      const isInternal = false;

      const mockComment = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        incident_id: incidentId,
        comment_text: commentText,
        is_internal: isInternal,
      };

      mockIncidentsService.addComment.mockResolvedValue(mockComment);

      const result = await controller.addComment(incidentId, commentText, isInternal);

      expect(result).toBeDefined();
      expect(mockIncidentsService.addComment).toHaveBeenCalledWith(
        incidentId,
        commentText,
        isInternal,
      );
    });
  });

  describe('export', () => {
    it('deve exportar incidentes para CSV', async () => {
      const filterDto: IncidentFilterDto = {};
      const csvBuffer = Buffer.from('incident_number,title,status\nINC-2025-0001,Teste,REPORTED');

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockExportService.exportToCSV.mockResolvedValue(csvBuffer);

      await controller.exportCSV(filterDto, mockResponse);

      expect(mockExportService.exportToCSV).toHaveBeenCalledWith(filterDto);
      expect(mockResponse.set).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(csvBuffer);
    });

    it('deve exportar incidente para PDF', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockStream = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(Buffer.from('PDF chunk'));
          }
          if (event === 'end') {
            handler();
          }
          return mockStream;
        }),
      };

      const mockResponse = {
        set: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as unknown as Response;

      mockExportService.exportIncidentToPDF.mockResolvedValue(mockStream);

      await controller.exportIncidentPDF(incidentId, mockResponse);

      expect(mockResponse.set).toHaveBeenCalled();
      expect(mockExportService.exportIncidentToPDF).toHaveBeenCalledWith(incidentId);
    });
  });
});
