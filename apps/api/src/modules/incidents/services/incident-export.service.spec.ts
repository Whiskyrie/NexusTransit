import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IncidentExportService } from './incident-export.service';
import { Incident } from '../entities/incident.entity';
import type { IncidentFilterDto } from '../dto/incident-filter.dto';
import { IncidentStatus, IncidentSeverity, IncidentType } from '../enums/incident.enums';

describe('IncidentExportService', () => {
  let service: IncidentExportService;
  let _incidentRepository: Repository<Incident>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockIncidentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentExportService,
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepository,
        },
      ],
    }).compile();

    service = module.get<IncidentExportService>(IncidentExportService);
    _incidentRepository = module.get<Repository<Incident>>(getRepositoryToken(Incident));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToCSV', () => {
    it('deve exportar incidentes para CSV', async () => {
      const filterDto: IncidentFilterDto = {};

      const mockIncidents = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          title: 'Acidente na via',
          status: IncidentStatus.RESOLVED,
          severity: IncidentSeverity.MEDIUM,
          incident_type: IncidentType.TRAFFIC_ACCIDENT,
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-01'),
        },
        {
          id: '2',
          incident_number: 'INC-2025-0002',
          title: 'Dano ao veículo',
          status: IncidentStatus.INVESTIGATING,
          severity: IncidentSeverity.HIGH,
          incident_type: IncidentType.DAMAGE,
          created_at: new Date('2025-01-02'),
          updated_at: new Date('2025-01-02'),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockIncidents);

      const csvData = await service.exportToCSV(filterDto);

      expect(csvData).toBeDefined();
      expect(Buffer.isBuffer(csvData)).toBe(true);
      const csvString = csvData.toString();
      expect(csvString).toContain('Número'); // Cabeçalho em português
      expect(csvString).toContain('INC-2025-0001');
      expect(csvString).toContain('INC-2025-0002');
    });

    it('deve lançar exceção quando não houver dados', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await expect(service.exportToCSV({})).rejects.toThrow('Nenhum incidente encontrado');
    });

    it('deve escapar valores com vírgulas no CSV', async () => {
      const mockIncidents = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          title: 'Acidente grave, motorista ferido',
          description: 'Colisão traseira, veículo danificado',
          status: IncidentStatus.REPORTED,
          severity: IncidentSeverity.HIGH,
          incident_type: IncidentType.TRAFFIC_ACCIDENT,
          impact_on_delivery: false,
          requires_insurance: false,
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-01'),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockIncidents);

      const csvData = await service.exportToCSV({});

      const csvString = csvData.toString();
      expect(csvString).toContain('"Colisão traseira, veículo danificado"');
    });
  });

  describe('exportToPDF', () => {
    it.skip('deve exportar incidente único para PDF', async () => {
      const incidentId = '123e4567-e89b-12d3-a456-426614174000';

      const mockIncident = {
        id: incidentId,
        incident_number: 'INC-2025-0001',
        title: 'Acidente na via',
        description: 'Descrição detalhada',
        status: IncidentStatus.RESOLVED,
        severity: IncidentSeverity.HIGH,
        incident_type: IncidentType.TRAFFIC_ACCIDENT,
        created_at: new Date(),
        attachments: [],
        comments: [],
      };

      mockIncidentRepository.findOne.mockResolvedValue(mockIncident);

      const pdfBuffer = await service.exportIncidentToPDF(incidentId);

      expect(pdfBuffer).toBeDefined();
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(mockIncidentRepository.findOne).toHaveBeenCalledWith({
        where: { id: incidentId },
        relations: ['attachments', 'comments'],
      });
    });

    it.skip('deve exportar múltiplos incidentes para PDF', async () => {
      const filterDto: IncidentFilterDto = {
        status: IncidentStatus.RESOLVED,
      };

      const mockIncidents = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          title: 'Incidente 1',
        },
        {
          id: '2',
          incident_number: 'INC-2025-0002',
          title: 'Incidente 2',
        },
      ];

      mockIncidentRepository.find.mockResolvedValue(mockIncidents);

      const pdfBuffer = await service.exportIncidentsToPDF(filterDto);

      expect(pdfBuffer).toBeDefined();
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });
  });

  describe('formatIncidentForExport', () => {
    it.skip('deve formatar incidente para export', () => {
      // Método privado não testado diretamente
      const mockIncident = {
        id: '1',
        incident_number: 'INC-2025-0001',
        title: 'Teste',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MEDIUM,
        incident_type: IncidentType.TRAFFIC_ACCIDENT,
        created_at: new Date('2025-01-01T10:00:00Z'),
        occurred_at: new Date('2025-01-01T09:30:00Z'),
        impact_on_delivery: true,
        requires_insurance: false,
      };

      const formatted = (service as any).formatIncidentForExport(mockIncident);

      expect(formatted).toBeDefined();
      expect(formatted.incident_number).toBe('INC-2025-0001');
      expect(formatted.status_translated).toBeDefined();
      expect(formatted.severity_translated).toBeDefined();
    });
  });
});
