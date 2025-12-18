import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TrackingHistoryService } from './tracking-history.service';
import { TrackingEvent } from '../entities/tracking-event.entity';
import {
  type TrackingHistoryData,
  type TrackingStatistics,
} from '../interfaces/tracking-history.interface';

describe('TrackingHistoryService', () => {
  let service: TrackingHistoryService;

  const mockHistoryData: TrackingHistoryData = {
    delivery_id: 'delivery-123',
    last_event_id: 'evt-123',
    current_status: 'IN_TRANSIT',
    current_event_status: 'SUCCESS',
    last_update: new Date('2025-12-18T10:00:00Z'),
    last_location: 'POINT(-46.6333 -23.5505)',
    last_latitude: -23.5505,
    last_longitude: -46.6333,
    last_address: 'Av. Paulista, 1000',
    driver_id: 'driver-123',
    route_id: 'route-123',
    current_speed: 60,
    current_battery_level: 85,
    location_accuracy: 10,
    total_events: 15,
    error_events: 0,
    warning_events: 1,
    first_event_time: new Date('2025-12-18T08:00:00Z'),
    last_event_time: new Date('2025-12-18T10:00:00Z'),
    total_duration_minutes: 120,
    total_distance_km: 50,
    materialized_at: new Date('2025-12-18T10:05:00Z'),
  };

  const mockStatistics: TrackingStatistics = {
    total_deliveries: 100,
    active_deliveries: 25,
    deliveries_with_errors: 5,
    deliveries_with_warnings: 10,
    avg_events_per_delivery: 12.5,
    avg_distance_km: 35.8,
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingHistoryService,
        {
          provide: getRepositoryToken(TrackingEvent),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TrackingHistoryService>(TrackingHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('should return history for a delivery', async () => {
      mockDataSource.query.mockResolvedValue([mockHistoryData]);

      const result = await service.getHistory('delivery-123');

      expect(result).toEqual(mockHistoryData);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no history found', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await expect(service.getHistory('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistories', () => {
    it('should return histories for multiple deliveries', async () => {
      const mockHistories = [mockHistoryData];
      mockDataSource.query.mockResolvedValue(mockHistories);

      const result = await service.getHistories(['delivery-123', 'delivery-456']);

      expect(result).toEqual(mockHistories);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should return empty array when no histories found', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.getHistories(['invalid-1', 'invalid-2']);

      expect(result).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return aggregated statistics', async () => {
      mockDataSource.query.mockResolvedValue([mockStatistics]);

      const result = await service.getStatistics();

      expect(result).toEqual(mockStatistics);
      expect(result.total_deliveries).toBe(100);
      expect(result.active_deliveries).toBe(25);
    });

    it('should handle empty statistics gracefully', async () => {
      mockDataSource.query.mockResolvedValue([
        {
          total_deliveries: 0,
          active_deliveries: 0,
          deliveries_with_errors: 0,
          deliveries_with_warnings: 0,
          avg_events_per_delivery: 0,
          avg_distance_km: 0,
        },
      ]);

      const result = await service.getStatistics();

      expect(result.total_deliveries).toBe(0);
    });
  });

  describe('getDeliveriesByStatus', () => {
    it('should return deliveries by status', async () => {
      const mockDeliveries = [mockHistoryData];
      mockDataSource.query.mockResolvedValue(mockDeliveries);

      const result = await service.getDeliveriesByStatus('IN_TRANSIT', 10);

      expect(result).toEqual(mockDeliveries);
      expect(result[0].current_status).toBe('IN_TRANSIT');
    });

    it('should limit results correctly', async () => {
      const mockDeliveries = Array(5).fill(mockHistoryData);
      mockDataSource.query.mockResolvedValue(mockDeliveries);

      const result = await service.getDeliveriesByStatus('IN_TRANSIT', 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('getActiveDeliveries', () => {
    it('should return active deliveries', async () => {
      const mockDeliveries = [
        { ...mockHistoryData, current_status: 'IN_TRANSIT' },
        { ...mockHistoryData, delivery_id: 'delivery-456', current_status: 'NEAR_DESTINATION' },
      ];
      mockDataSource.query.mockResolvedValue(mockDeliveries);

      const result = await service.getActiveDeliveries();

      expect(result).toEqual(mockDeliveries);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('refreshMaterializedView', () => {
    it('should refresh the materialized view', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await service.refreshMaterializedView();

      expect(mockDataSource.query).toHaveBeenCalledWith(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY tracking_history',
      );
    });

    it('should handle refresh errors', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Refresh failed'));

      await expect(service.refreshMaterializedView()).rejects.toThrow('Refresh failed');
    });
  });

  describe('getLastRefreshTime', () => {
    it('should return last refresh time', async () => {
      const lastRefresh = new Date('2025-12-18T10:05:00Z');
      mockDataSource.query.mockResolvedValue([{ last_refresh: lastRefresh }]);

      const result = await service.getLastRefreshTime();

      expect(result).toEqual(lastRefresh);
    });

    it('should return null when no refresh time', async () => {
      mockDataSource.query.mockResolvedValue([{ last_refresh: null }]);

      const result = await service.getLastRefreshTime();

      expect(result).toBeNull();
    });
  });

  describe('getStaleDeliveries', () => {
    it('should return deliveries without recent updates', async () => {
      const staleDelivery = {
        ...mockHistoryData,
        last_update: new Date('2025-12-18T06:00:00Z'), // 4 hours ago
      };
      mockDataSource.query.mockResolvedValue([staleDelivery]);

      const result = await service.getStaleDeliveries(120, 10); // 2 hours threshold

      expect(result).toEqual([staleDelivery]);
    });
  });

  describe('getLowBatteryDeliveries', () => {
    it('should return deliveries with low battery', async () => {
      const lowBatteryDelivery = {
        ...mockHistoryData,
        current_battery_level: 15,
      };
      mockDataSource.query.mockResolvedValue([lowBatteryDelivery]);

      const result = await service.getLowBatteryDeliveries(20, 10);

      expect(result).toEqual([lowBatteryDelivery]);
      expect(result[0].current_battery_level).toBeLessThan(20);
    });
  });

  describe('getLowAccuracyDeliveries', () => {
    it('should return deliveries with low GPS accuracy', async () => {
      const lowAccuracyDelivery = {
        ...mockHistoryData,
        location_accuracy: 150,
      };
      mockDataSource.query.mockResolvedValue([lowAccuracyDelivery]);

      const result = await service.getLowAccuracyDeliveries(100, 10);

      expect(result).toEqual([lowAccuracyDelivery]);
      expect(result[0].location_accuracy).toBeGreaterThan(100);
    });
  });

  describe('scheduledRefresh', () => {
    it('should call refresh on schedule', async () => {
      const refreshSpy = jest.spyOn(service, 'refreshMaterializedView').mockResolvedValue();

      await service.scheduledRefresh();

      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should handle scheduled refresh errors', async () => {
      jest.spyOn(service, 'refreshMaterializedView').mockRejectedValue(new Error('Failed'));

      await expect(service.scheduledRefresh()).resolves.not.toThrow();
    });
  });
});
