import { Controller, Get, Param, HttpStatus, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { RateLimitByIP } from '@nexus/rate-limit';
import { TrackingEventsService } from '../services/tracking-events.service';
import { TrackingCalculationService } from '../services/tracking-calculation.service';
import {
  PublicTrackingResponseDto,
  PublicTrackingTimelineDto,
  PublicTrackingMapDto,
  PublicTrackingEventDto,
} from '../dto/public-tracking-response.dto';
import { EventType } from '../enums/event-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { TrackingEvent } from '../entities/tracking-event.entity';

/**
 * Controller público para rastreamento de entregas (SEM autenticação)
 *
 * Endpoints públicos para consulta de rastreamento via tracking_code
 * Implementa rate limiting para prevenir abuso
 */
@ApiTags('Public Tracking')
@Controller('public/tracking')
export class PublicTrackingController {
  constructor(
    private readonly trackingEventsService: TrackingEventsService,
    private readonly trackingCalculationService: TrackingCalculationService,
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  @Get(':trackingCode')
  @RateLimitByIP(10, 60000) // 10 requisições por minuto por IP
  @ApiOperation({
    summary: 'Rastreamento público por código',
    description:
      'Retorna informações completas de rastreamento para um código específico (endpoint público, sem autenticação)',
  })
  @ApiParam({
    name: 'trackingCode',
    description: 'Código de rastreamento da entrega',
    type: String,
    example: 'NXS202412180001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rastreamento encontrado com sucesso',
    type: PublicTrackingResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Código de rastreamento não encontrado',
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas requisições. Tente novamente mais tarde.',
  })
  async trackByCode(
    @Param('trackingCode') trackingCode: string,
  ): Promise<PublicTrackingResponseDto> {
    // Buscar entrega
    const delivery = await this.deliveryRepository.findOne({
      where: { tracking_code: trackingCode },
      relations: ['customer'],
    });

    if (!delivery) {
      throw new NotFoundException(`Código de rastreamento não encontrado: ${trackingCode}`);
    }

    // Buscar eventos
    const events = await this.trackingEventsService.findByTrackingCode(trackingCode);

    if (!events || events.length === 0) {
      throw new NotFoundException(`Nenhum evento encontrado para o código: ${trackingCode}`);
    }

    // Validar endereço de origem
    if (!delivery.pickup_address) {
      throw new NotFoundException(
        `Endereço de origem não encontrado para o código: ${trackingCode}`,
      );
    }

    // Buscar último evento (pode ser undefined se não houver eventos)
    const latestEvent = events.at(-1);

    // Montar resposta pública
    const response: PublicTrackingResponseDto = {
      tracking_code: delivery.tracking_code,
      current_status: delivery.status,
      description: delivery.description,
      created_at: delivery.created_at,
      estimated_delivery_at: delivery.scheduled_delivery_at,
      last_update: latestEvent?.timestamp,
      origin: {
        address: delivery.pickup_address.street || '',
        city: delivery.pickup_address.city || '',
        state: delivery.pickup_address.state || '',
        postal_code: delivery.pickup_address.postal_code || '',
      },
      destination: {
        address: delivery.delivery_address.street,
        city: delivery.delivery_address.city,
        state: delivery.delivery_address.state,
        postal_code: delivery.delivery_address.postal_code,
      },
      timeline: events.map(event => this.mapToPublicEventDto(event)),
    };

    return response;
  }

  @Get(':trackingCode/timeline')
  @RateLimitByIP(15, 60000) // 15 requisições por minuto por IP
  @ApiOperation({
    summary: 'Timeline visual de eventos',
    description: 'Retorna timeline de eventos formatada para exibição visual (endpoint público)',
  })
  @ApiParam({
    name: 'trackingCode',
    description: 'Código de rastreamento da entrega',
    type: String,
    example: 'NXS202412180001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timeline de eventos',
    type: PublicTrackingTimelineDto,
  })
  @ApiNotFoundResponse({
    description: 'Código de rastreamento não encontrado',
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas requisições. Tente novamente mais tarde.',
  })
  async getTimeline(
    @Param('trackingCode') trackingCode: string,
  ): Promise<PublicTrackingTimelineDto> {
    // Buscar entrega
    const delivery = await this.deliveryRepository.findOne({
      where: { tracking_code: trackingCode },
    });

    if (!delivery) {
      throw new NotFoundException(`Código de rastreamento não encontrado: ${trackingCode}`);
    }

    // Buscar eventos
    const events = await this.trackingEventsService.findByTrackingCode(trackingCode);

    if (!events || events.length === 0) {
      throw new NotFoundException(`Nenhum evento encontrado para o código: ${trackingCode}`);
    }

    // Calcular progresso estimado baseado nos eventos
    const progress = this.calculateProgress(events);

    const response: PublicTrackingTimelineDto = {
      tracking_code: trackingCode,
      current_status: delivery.status,
      events: events.map(event => this.mapToPublicEventDto(event)),
      total_events: events.length,
      progress_percentage: progress,
    };

    return response;
  }

  @Get(':trackingCode/map')
  @RateLimitByIP(10, 60000) // 10 requisições por minuto por IP
  @ApiOperation({
    summary: 'Dados para visualização em mapa',
    description: 'Retorna coordenadas e rota para renderização em mapa (endpoint público)',
  })
  @ApiParam({
    name: 'trackingCode',
    description: 'Código de rastreamento da entrega',
    type: String,
    example: 'NXS202412180001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do mapa',
    type: PublicTrackingMapDto,
  })
  @ApiNotFoundResponse({
    description: 'Código de rastreamento não encontrado',
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas requisições. Tente novamente mais tarde.',
  })
  async getMapData(@Param('trackingCode') trackingCode: string): Promise<PublicTrackingMapDto> {
    // Buscar entrega
    const delivery = await this.deliveryRepository.findOne({
      where: { tracking_code: trackingCode },
    });

    if (!delivery) {
      throw new NotFoundException(`Código de rastreamento não encontrado: ${trackingCode}`);
    }

    // Buscar eventos com localização
    const routeEvents =
      await this.trackingEventsService.findRoutePointsByTrackingCode(trackingCode);

    // Buscar último evento com localização
    const latestEvent = await this.trackingEventsService.findLatestByTrackingCode(trackingCode);

    // Calcular distância total
    let totalDistanceKm: number | undefined;
    let remainingDistanceKm: number | undefined;
    if (routeEvents.length > 1) {
      try {
        const distanceResult = await this.trackingCalculationService.calculateTotalDistance(
          delivery.id,
        );
        totalDistanceKm = distanceResult.distance_km;

        // Calcular distância restante se houver localização atual
        if (latestEvent) {
          const currentCoords = latestEvent.getCoordinates();
          if (currentCoords) {
            const distanceResult =
              await this.trackingCalculationService.calculateDistanceBetweenCoordinates(
                currentCoords.latitude,
                currentCoords.longitude,
                delivery.delivery_address.latitude ?? 0,
                delivery.delivery_address.longitude ?? 0,
              );
            remainingDistanceKm = distanceResult.distance_km;
          }
        }
      } catch {
        // Se falhar, continuar sem distância
      }
    }

    // Montar resposta
    const response: PublicTrackingMapDto = {
      tracking_code: trackingCode,
      current_status: delivery.status,
      origin: {
        latitude: delivery.pickup_address.latitude ?? 0,
        longitude: delivery.pickup_address.longitude ?? 0,
        address: `${delivery.pickup_address.street}, ${delivery.pickup_address.city} - ${delivery.pickup_address.state}`,
      },
      destination: {
        latitude: delivery.delivery_address.latitude ?? 0,
        longitude: delivery.delivery_address.longitude ?? 0,
        address: `${delivery.delivery_address.street}, ${delivery.delivery_address.city} - ${delivery.delivery_address.state}`,
      },
      route: routeEvents.map(event => {
        const coords = event.getCoordinates();
        return {
          latitude: coords?.latitude ?? 0,
          longitude: coords?.longitude ?? 0,
          timestamp: event.timestamp,
        };
      }),
      total_distance_km: totalDistanceKm,
      remaining_distance_km: remainingDistanceKm,
    };

    // Adicionar localização atual se disponível
    const currentCoords = latestEvent?.getCoordinates();
    if (currentCoords && latestEvent) {
      response.current_location = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        address: latestEvent.location_address,
        timestamp: latestEvent.timestamp,
      };
    }

    return response;
  }

  /**
   * Mapeia evento interno para DTO público (remove informações sensíveis)
   */
  private mapToPublicEventDto(event: TrackingEvent): PublicTrackingEventDto {
    return {
      event_type: event.event_type,
      event_status: event.event_status,
      timestamp: event.timestamp,
      location: event.location_address,
      notes: event.notes,
    };
  }

  /**
   * Calcula progresso estimado baseado na sequência de eventos
   */
  private calculateProgress(events: TrackingEvent[]): number {
    if (!events || events.length === 0) {
      return 0;
    }

    // Pesos dos eventos para cálculo de progresso
    const eventWeights: Record<EventType, number> = {
      [EventType.CREATED]: 5,
      [EventType.ASSIGNED]: 10,
      [EventType.PICKUP_STARTED]: 20,
      [EventType.PICKED_UP]: 30,
      [EventType.IN_TRANSIT]: 50,
      [EventType.NEAR_DESTINATION]: 75,
      [EventType.ARRIVED]: 90,
      [EventType.DELIVERED]: 100,
      [EventType.FAILED]: 0,
      [EventType.CANCELED]: 0,
      [EventType.DELAYED]: 0,
      [EventType.RESCHEDULED]: 0,
    };

    // Pegar último evento
    const lastEvent = events.at(-1);
    if (!lastEvent) {
      return 0;
    }

    const progress = eventWeights[lastEvent.event_type] ?? 0;

    return progress;
  }
}
