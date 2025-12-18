import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PublicTrackingController } from './public-tracking.controller';
import { TrackingEventsService } from '../services/tracking-events.service';
import { TrackingCalculationService } from '../services/tracking-calculation.service';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

describe('PublicTrackingController', () => {
  let controller: PublicTrackingController;

  const mockDelivery = {
    id: 'delivery-123',
    tracking_code: 'NXS202412180001',
    status: 'IN_TRANSIT',
    description: 'Test delivery',
    created_at: new Date('2025-12-18T08:00:00Z'),
    scheduled_delivery_at: new Date('2025-12-18T18:00:00Z'),
    pickup_address: {
      street: 'Rua A, 123',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01234-567',
      latitude: -23.5505,
      longitude: -46.6333,
    },
    delivery_address: {
      street: 'Rua B, 456',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01234-567',
      latitude: -23.5515,
      longitude: -46.6343,
    },
  };

  const mockEvent = {
    id: 'evt-123',
    event_id: 'evt-123',
    delivery_id: 'delivery-123',
    event_type: EventType.IN_TRANSIT,
    event_status: EventStatus.SUCCESS,
    timestamp: new Date('2025-12-18T10:00:00Z'),
    location: 'POINT(-46.6333 -23.5505)',
    location_address: 'Av. Paulista, 1000',
    notes: 'Em trânsito',
    getCoordinates: jest.fn().mockReturnValue({
      latitude: -23.5505,
      longitude: -46.6333,
    }),
  };

  const mockTrackingEventsService = {
    findByTrackingCode: jest.fn(),
    findLatestByTrackingCode: jest.fn(),
    findRoutePointsByTrackingCode: jest.fn(),
  };

  const mockTrackingCalculationService = {
    calculateTotalDistance: jest.fn(),
    calculateDistanceBetweenCoordinates: jest.fn(),
  };

  const mockDeliveryRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicTrackingController],
      providers: [
        {
          provide: TrackingEventsService,
          useValue: mockTrackingEventsService,
        },
        {
          provide: TrackingCalculationService,
          useValue: mockTrackingCalculationService,
        },
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepository,
        },
      ],
    }).compile();

    controller = module.get<PublicTrackingController>(PublicTrackingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackByCode', () => {
    it('should return full tracking information', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findByTrackingCode.mockResolvedValue([mockEvent]);
      mockTrackingEventsService.findLatestByTrackingCode.mockResolvedValue(mockEvent);

      const result = await controller.trackByCode('NXS202412180001');

      expect(result).toBeDefined();
      expect(result.tracking_code).toBe('NXS202412180001');
      expect(result.current_status).toBe('IN_TRANSIT');
      expect(result.timeline).toHaveLength(1);
      expect(result.origin.city).toBe('São Paulo');
      expect(result.destination.city).toBe('São Paulo');
    });

    it('should throw NotFoundException when delivery not found', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      await expect(controller.trackByCode('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no events found', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findByTrackingCode.mockResolvedValue([]);

      await expect(controller.trackByCode('NXS202412180001')).rejects.toThrow(NotFoundException);
    });

    it('should handle delivery without pickup address gracefully', async () => {
      const deliveryWithoutPickup = { ...mockDelivery, pickup_address: null };
      mockDeliveryRepository.findOne.mockResolvedValue(deliveryWithoutPickup);
      mockTrackingEventsService.findByTrackingCode.mockResolvedValue([mockEvent]);
      mockTrackingEventsService.findLatestByTrackingCode.mockResolvedValue(mockEvent);

      await expect(controller.trackByCode('NXS202412180001')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTimeline', () => {
    it('should return timeline with events', async () => {
      const mockEvents = [
        mockEvent,
        {
          ...mockEvent,
          id: 'evt-124',
          event_type: EventType.CREATED,
          timestamp: new Date('2025-12-18T08:00:00Z'),
        },
      ];

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findByTrackingCode.mockResolvedValue(mockEvents);

      const result = await controller.getTimeline('NXS202412180001');

      expect(result).toBeDefined();
      expect(result.tracking_code).toBe('NXS202412180001');
      expect(result.events).toHaveLength(2);
      expect(result.total_events).toBe(2);
      expect(result.progress_percentage).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when delivery not found', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      await expect(controller.getTimeline('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should return empty timeline when no events', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findByTrackingCode.mockResolvedValue([]);

      await expect(controller.getTimeline('NXS202412180001')).rejects.toThrow(NotFoundException);
    });

    it('should calculate progress percentage correctly', async () => {
      const deliveredEvent = {
        ...mockEvent,
        event_type: EventType.DELIVERED,
      };

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findByTrackingCode.mockResolvedValue([deliveredEvent]);

      const result = await controller.getTimeline('NXS202412180001');

      expect(result.progress_percentage).toBe(100);
    });
  });

  describe('getMapData', () => {
    it('should return map data with route', async () => {
      const mockRouteEvents = [mockEvent, mockEvent]; // Precisa de 2+ eventos para calcular distância

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findLatestByTrackingCode.mockResolvedValue(mockEvent);
      mockTrackingEventsService.findRoutePointsByTrackingCode.mockResolvedValue(mockRouteEvents);
      mockTrackingCalculationService.calculateTotalDistance.mockResolvedValue({
        distance_meters: 15000,
        distance_km: 15,
      });
      mockTrackingCalculationService.calculateDistanceBetweenCoordinates.mockResolvedValue({
        distance_meters: 5000,
        distance_km: 5,
      });

      const result = await controller.getMapData('NXS202412180001');

      expect(result).toBeDefined();
      expect(result.tracking_code).toBe('NXS202412180001');
      expect(result.current_location).toBeDefined();
      expect(result.current_location?.latitude).toBe(-23.5505);
      expect(result.origin.latitude).toBe(-23.5505);
      expect(result.destination.latitude).toBe(-23.5515);
      expect(result.route).toHaveLength(2);
      expect(result.total_distance_km).toBe(15);
    });

    it('should throw NotFoundException when delivery not found', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      await expect(controller.getMapData('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should handle no route points', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findLatestByTrackingCode.mockResolvedValue(mockEvent);
      mockTrackingEventsService.findRoutePointsByTrackingCode.mockResolvedValue([]);
      mockTrackingCalculationService.calculateTotalDistance.mockResolvedValue({
        delivery_id: 'delivery-123',
        total_distance_meters: 0,
        total_distance_km: 0,
      });

      const result = await controller.getMapData('NXS202412180001');

      expect(result.route).toHaveLength(0);
    });

    it('should calculate remaining distance when coordinates available', async () => {
      const mockRouteEvents = [mockEvent, mockEvent]; // Precisa de 2+ eventos

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findLatestByTrackingCode.mockResolvedValue(mockEvent);
      mockTrackingEventsService.findRoutePointsByTrackingCode.mockResolvedValue(mockRouteEvents);
      mockTrackingCalculationService.calculateTotalDistance.mockResolvedValue({
        distance_meters: 15000,
        distance_km: 15,
      });
      mockTrackingCalculationService.calculateDistanceBetweenCoordinates.mockResolvedValue({
        distance_meters: 5000,
        distance_km: 5,
      });

      const result = await controller.getMapData('NXS202412180001');

      expect(result.remaining_distance_km).toBeDefined();
      expect(result.remaining_distance_km).toBe(5);
    });

    it('should handle event without location', async () => {
      const eventWithoutLocation = { ...mockEvent, location: null, getCoordinates: () => null };

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventsService.findLatestByTrackingCode.mockResolvedValue(eventWithoutLocation);
      mockTrackingEventsService.findRoutePointsByTrackingCode.mockResolvedValue([]);
      mockTrackingCalculationService.calculateTotalDistance.mockResolvedValue({
        distance_meters: 0,
        distance_km: 0,
      });

      const result = await controller.getMapData('NXS202412180001');

      expect(result.current_location).toBeUndefined();
    });
  });
});
