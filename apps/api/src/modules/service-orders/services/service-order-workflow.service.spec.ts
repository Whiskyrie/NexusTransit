import { Test, type TestingModule } from '@nestjs/testing';
import { ServiceOrderWorkflowService } from './service-order-workflow.service';
import { OrderStatus } from '../enums/service_order-status';
import { BadRequestException } from '@nestjs/common';

describe('ServiceOrderWorkflowService', () => {
  let service: ServiceOrderWorkflowService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ServiceOrderWorkflowService],
    }).compile();

    service = module.get<ServiceOrderWorkflowService>(ServiceOrderWorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('canTransition', () => {
    it('deve permitir transição de PENDING para SCHEDULED', async () => {
      const result = await service.canTransition(OrderStatus.PENDING, OrderStatus.SCHEDULED, {
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(result).toBe(true);
    });

    it('deve rejeitar transição de PENDING para SCHEDULED sem data futura', async () => {
      const result = await service.canTransition(OrderStatus.PENDING, OrderStatus.SCHEDULED, {
        scheduled_date: new Date(Date.now() - 86400000).toISOString(),
      });
      expect(result).toBe(false);
    });

    it('deve permitir transição de IN_PROGRESS para ON_HOLD', async () => {
      const result = await service.canTransition(OrderStatus.IN_PROGRESS, OrderStatus.ON_HOLD);
      expect(result).toBe(true);
    });

    it('deve permitir transição de ON_HOLD para IN_PROGRESS', async () => {
      const result = await service.canTransition(OrderStatus.ON_HOLD, OrderStatus.IN_PROGRESS);
      expect(result).toBe(true);
    });

    it('não deve permitir transição de status final DELIVERED', async () => {
      const result = await service.canTransition(OrderStatus.DELIVERED, OrderStatus.IN_PROGRESS);
      expect(result).toBe(false);
    });

    it('não deve permitir transição de status final CANCELLED', async () => {
      const result = await service.canTransition(OrderStatus.CANCELLED, OrderStatus.PENDING);
      expect(result).toBe(false);
    });

    it('não deve permitir transição para o mesmo status', async () => {
      const result = await service.canTransition(OrderStatus.PENDING, OrderStatus.PENDING);
      expect(result).toBe(false);
    });

    it('não deve permitir transição não definida', async () => {
      const result = await service.canTransition(OrderStatus.PENDING, OrderStatus.DELIVERED);
      expect(result).toBe(false);
    });
  });

  describe('getAvailableTransitions', () => {
    it('deve retornar transições disponíveis para PENDING', () => {
      const transitions = service.getAvailableTransitions(OrderStatus.PENDING);
      expect(transitions).toContain(OrderStatus.SCHEDULED);
      expect(transitions).toContain(OrderStatus.CANCELLED);
      expect(transitions).toHaveLength(2);
    });

    it('deve retornar transições disponíveis para IN_PROGRESS', () => {
      const transitions = service.getAvailableTransitions(OrderStatus.IN_PROGRESS);
      expect(transitions).toContain(OrderStatus.DELIVERED);
      expect(transitions).toContain(OrderStatus.ON_HOLD);
      expect(transitions).toContain(OrderStatus.CANCELLED);
    });

    it('deve retornar array vazio para status final', () => {
      const transitions = service.getAvailableTransitions(OrderStatus.DELIVERED);
      expect(transitions).toEqual([]);
    });
  });

  describe('requiresApproval', () => {
    it('deve retornar true para transição IN_PROGRESS -> CANCELLED', () => {
      const requires = service.requiresApproval(OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED);
      expect(requires).toBe(true);
    });

    it('deve retornar false para transições normais', () => {
      const requires = service.requiresApproval(OrderStatus.PENDING, OrderStatus.SCHEDULED);
      expect(requires).toBe(false);
    });
  });

  describe('getWorkflowInfo', () => {
    it('deve retornar informações corretas do workflow', () => {
      const info = service.getWorkflowInfo(OrderStatus.IN_PROGRESS);
      expect(info.currentStatus).toBe(OrderStatus.IN_PROGRESS);
      expect(info.isFinal).toBe(false);
      expect(info.availableTransitions.length).toBeGreaterThan(0);
    });

    it('deve marcar status final corretamente', () => {
      const info = service.getWorkflowInfo(OrderStatus.DELIVERED);
      expect(info.isFinal).toBe(true);
      expect(info.availableTransitions).toEqual([]);
    });
  });

  describe('executeTransition', () => {
    it('deve executar transição válida', async () => {
      await expect(
        service.executeTransition(OrderStatus.PENDING, OrderStatus.SCHEDULED, {
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        }),
      ).resolves.not.toThrow();
    });

    it('deve lançar erro para transição inválida', async () => {
      await expect(
        service.executeTransition(OrderStatus.DELIVERED, OrderStatus.PENDING, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando contexto não passa validação', async () => {
      await expect(
        service.executeTransition(OrderStatus.PENDING, OrderStatus.SCHEDULED, {
          scheduled_date: new Date(Date.now() - 86400000).toISOString(), // Data no passado
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
