import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { NearbyIncidentsDto } from '../dto/nearby-incidents.dto';
import { WithinAreaDto, Coordinate } from '../dto/within-area.dto';
import { IncidentWithDistanceDto } from '../dto/incident-with-distance.dto';
import { IncidentResponseDto } from '../dto/incident-response.dto';

/**
 * Serviço para operações geoespaciais em incidentes
 *
 * Utiliza PostGIS para queries espaciais eficientes
 */
@Injectable()
export class IncidentGeoService {
  private readonly logger = new Logger(IncidentGeoService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  /**
   * Busca incidentes próximos a uma localização usando ST_DWithin
   *
   * @param dto Parâmetros de busca (lat, lng, raio)
   * @returns Array de incidentes com distância calculada
   */
  async findNearby(dto: NearbyIncidentsDto): Promise<IncidentWithDistanceDto[]> {
    const { latitude, longitude, radius_meters = 5000, status, limit = 50 } = dto;

    this.logger.debug(
      `Buscando incidentes próximos a (${latitude}, ${longitude}) com raio de ${radius_meters}m`,
    );

    // Construir query com PostGIS
    let query = this.incidentRepository
      .createQueryBuilder('incident')
      .select([
        'incident.*',
        `ST_Distance(
          incident.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) as distance_meters`,
      ])
      .where(
        `ST_DWithin(
          incident.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
      )
      .andWhere('incident.deleted_at IS NULL')
      .setParameters({
        latitude,
        longitude,
        radius: radius_meters,
      })
      .orderBy('distance_meters', 'ASC')
      .limit(limit);

    // Filtrar por status se fornecido
    if (status) {
      query = query.andWhere('incident.status = :status', { status });
    }

    const rawResults = await query.getRawMany();

    // Mapear resultados para DTO
    return rawResults.map(raw => this.mapToIncidentWithDistance(raw as Record<string, unknown>));
  }

  /**
   * Busca incidentes dentro de uma área poligonal usando ST_Within
   *
   * @param dto Parâmetros de busca (coordenadas do polígono)
   * @returns Array de incidentes dentro da área
   */
  async findWithinArea(dto: WithinAreaDto): Promise<IncidentResponseDto[]> {
    const { coordinates, status, limit = 100 } = dto;

    // Validar que o polígono é fechado (primeira coordenada = última)
    if (!this.isPolygonClosed(coordinates)) {
      throw new Error('O polígono deve ser fechado (primeira coordenada = última coordenada)');
    }

    this.logger.debug(`Buscando incidentes dentro de área com ${coordinates.length} pontos`);

    // Construir WKT (Well-Known Text) do polígono
    const polygonWKT = this.buildPolygonWKT(coordinates);

    // Construir query com PostGIS
    let query = this.incidentRepository
      .createQueryBuilder('incident')
      .where(
        `ST_Within(
          incident.location,
          ST_GeomFromText(:polygon, 4326)
        )`,
      )
      .andWhere('incident.deleted_at IS NULL')
      .setParameters({
        polygon: polygonWKT,
      })
      .orderBy('incident.created_at', 'DESC')
      .limit(limit);

    // Filtrar por status se fornecido
    if (status) {
      query = query.andWhere('incident.status = :status', { status });
    }

    const incidents = await query.getMany();

    // Mapear para DTO de resposta
    return incidents.map(incident => this.mapToResponseDto(incident));
  }

  /**
   * Verifica se um polígono está fechado
   */
  private isPolygonClosed(coordinates: Coordinate[]): boolean {
    if (coordinates.length < 4) {
      return false;
    }

    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    return first.latitude === last.latitude && first.longitude === last.longitude;
  }

  /**
   * Constrói string WKT (Well-Known Text) de um polígono
   */
  private buildPolygonWKT(coordinates: Coordinate[]): string {
    const points = coordinates.map(coord => `${coord.longitude} ${coord.latitude}`).join(', ');

    return `POLYGON((${points}))`;
  }

  /**
   * Mapeia resultado raw para DTO com distância
   */
  private mapToIncidentWithDistance(raw: Record<string, unknown>): IncidentWithDistanceDto {
    const dto = new IncidentWithDistanceDto();

    // Mapear campos do incidente
    Object.assign(dto, {
      id: raw.id,
      incident_type: raw.incident_type,
      severity: raw.severity,
      status: raw.status,
      title: raw.title,
      description: raw.description,
      reported_at: raw.reported_at,
      resolved_at: raw.resolved_at,
      resolution_notes: raw.resolution_notes,
      affected_routes: raw.affected_routes,
      estimated_delay_minutes: raw.estimated_delay_minutes,
      vehicle_id: raw.vehicle_id,
      driver_id: raw.driver_id,
      reported_by_user_id: raw.reported_by_user_id,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });

    // Adicionar informações de distância
    const rawDistance = raw.distance_meters;
    const distanceMeters =
      typeof rawDistance === 'number'
        ? rawDistance
        : typeof rawDistance === 'string'
          ? parseFloat(rawDistance)
          : 0;
    dto.distance_meters = distanceMeters;
    dto.distance_formatted = this.formatDistance(distanceMeters);

    return dto;
  }

  /**
   * Formata distância em metros para string legível
   */
  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }

  /**
   * Mapeia entidade para DTO de resposta
   */
  private mapToResponseDto(incident: Incident): IncidentResponseDto {
    const dto = new IncidentResponseDto();
    Object.assign(dto, incident);
    return dto;
  }
}
