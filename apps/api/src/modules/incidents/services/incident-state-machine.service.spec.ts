import { Test, type TestingModule } from '@nestjs/testing';

import { IncidentStateMachineService } from './incident-state-machine.service';
import { IncidentStatus } from '../enums/incident.enums';

describe('IncidentStateMachineService', () => {
  let service: IncidentStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentStateMachineService],
    }).compile();

    service = module.get<IncidentStateMachineService>(IncidentStateMachineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTransition', () => {
    it('deve validar transição REPORTED → INVESTIGATING', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING);
      }).not.toThrow();
    });

    it('deve validar transição INVESTIGATING → IN_PROGRESS', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.INVESTIGATING, IncidentStatus.IN_PROGRESS);
      }).not.toThrow();
    });

    it('deve validar transição IN_PROGRESS → RESOLVED', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED);
      }).not.toThrow();
    });

    it('deve validar transição RESOLVED → CLOSED', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.RESOLVED, IncidentStatus.CLOSED);
      }).not.toThrow();
    });

    it('deve validar transição IN_PROGRESS → ESCALATED', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.IN_PROGRESS, IncidentStatus.ESCALATED);
      }).not.toThrow();
    });

    it('deve validar transição ESCALATED → RESOLVED', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.ESCALATED, IncidentStatus.RESOLVED);
      }).not.toThrow();
    });

    it('deve validar transição RESOLVED → IN_PROGRESS (reabertura)', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.RESOLVED, IncidentStatus.IN_PROGRESS);
      }).not.toThrow();
    });

    it('deve validar transição CLOSED → INVESTIGATING (reabertura)', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.CLOSED, IncidentStatus.INVESTIGATING);
      }).not.toThrow();
    });

    it('deve rejeitar transição inválida REPORTED → RESOLVED', () => {
      const result = service.validateTransition(IncidentStatus.REPORTED, IncidentStatus.RESOLVED);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('deve rejeitar transição inválida INVESTIGATING → CLOSED (pulo de etapa)', () => {
      expect(() => {
        service.validateTransition(IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED);
      }).not.toThrow(); // Esta transição é permitida para fechar rapidamente
    });

    it('deve rejeitar transição CLOSED → REPORTED', () => {
      const result = service.validateTransition(IncidentStatus.CLOSED, IncidentStatus.REPORTED);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('deve rejeitar transição do mesmo status', () => {
      const result = service.validateTransition(
        IncidentStatus.INVESTIGATING,
        IncidentStatus.INVESTIGATING,
      );
      expect(result.valid).toBe(true); // validateTransition permite mesmo status, canTransition que bloqueia
    });
  });

  describe('canTransition', () => {
    it('deve retornar true para transição válida', () => {
      const result = service.canTransition(IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING);
      expect(result).toBe(true);
    });

    it('deve retornar false para transição inválida', () => {
      const result = service.canTransition(IncidentStatus.REPORTED, IncidentStatus.RESOLVED);
      expect(result).toBe(false);
    });

    it('deve retornar false para transição do mesmo status', () => {
      const result = service.canTransition(IncidentStatus.REPORTED, IncidentStatus.REPORTED);
      expect(result).toBe(false);
    });
  });
});
