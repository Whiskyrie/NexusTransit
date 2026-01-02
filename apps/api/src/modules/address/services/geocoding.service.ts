import { Injectable, Logger } from '@nestjs/common';
import { GoogleMapsService } from '@nexus/geo-services';
import { RedisService } from '@nexus/redis';
import { CACHE_KEYS, CACHE_TTL } from '../constants';
import {
  GeocodingFailedException,
  ReverseGeocodingFailedException,
  InvalidCoordinatesException,
} from '../exceptions';
import {
  IGeocodingRequest,
  IGeocodingResponse,
  IReverseGeocodingRequest,
  IReverseGeocodingResponse,
  IGeocodingService,
} from '../interfaces';
import { AddressFormatterUtil } from '../utils';

/**
 * Serviço de geocoding e reverse geocoding
 *
 * Responsável por:
 * - Converter endereço em coordenadas (geocoding)
 * - Converter coordenadas em endereço (reverse geocoding)
 * - Cache de resultados com Redis
 * - Integração com GoogleMapsService
 */
@Injectable()
export class GeocodingService implements IGeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Converte endereço em coordenadas geográficas
   */
  async geocode(request: IGeocodingRequest): Promise<IGeocodingResponse> {
    // Validar requisição
    this.validateGeocodingRequest(request);

    // Gerar chave de cache
    const cacheKey = this.generateGeocodingCacheKey(request);

    // Verificar cache
    const cached = await this.getCachedGeocodingResult(cacheKey);
    if (cached) {
      this.logger.debug(`Geocoding encontrado no cache`);
      return { ...cached, cached: true };
    }

    // Formatar endereço
    const fullAddress = this.formatAddressForGeocoding(request);

    this.logger.log(`Geocoding: ${fullAddress}`);

    try {
      // Chamar API de geocoding
      const result = await this.googleMapsService.geocode(fullAddress);

      if (!result?.results?.length) {
        throw new GeocodingFailedException(fullAddress, 'Nenhum resultado encontrado');
      }

      const firstResult = result.results[0];
      if (!firstResult) {
        throw new GeocodingFailedException(fullAddress, 'Nenhum resultado encontrado');
      }

      // Mapear resposta
      const response: IGeocodingResponse = {
        latitude: firstResult.geometry.location.lat,
        longitude: firstResult.geometry.location.lng,
        formatted_address: firstResult.formatted_address,
        accuracy: firstResult.geometry.location_type,
        provider: 'Google Maps',
        cached: false,
      };

      // Salvar no cache
      await this.cacheGeocodingResult(cacheKey, response);

      this.logger.debug(`Geocoding concluído: ${response.latitude}, ${response.longitude}`);

      return response;
    } catch (error) {
      this.logger.error(`Erro ao fazer geocoding:`, error);

      if (error instanceof GeocodingFailedException) {
        throw error;
      }

      throw new GeocodingFailedException(
        fullAddress,
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }

  /**
   * Converte coordenadas em endereço
   */
  async reverseGeocode(request: IReverseGeocodingRequest): Promise<IReverseGeocodingResponse> {
    // Validar coordenadas
    this.validateCoordinates(request.latitude, request.longitude);

    // Gerar chave de cache
    const cacheKey = this.generateReverseGeocodingCacheKey(request);

    // Verificar cache
    const cached = await this.getCachedReverseGeocodingResult(cacheKey);
    if (cached) {
      this.logger.debug(`Reverse geocoding encontrado no cache`);
      return { ...cached, cached: true };
    }

    this.logger.log(`Reverse geocoding: ${request.latitude}, ${request.longitude}`);

    try {
      // Chamar API de reverse geocoding
      const result = await this.googleMapsService.reverseGeocode(
        request.latitude,
        request.longitude,
      );

      if (!result?.results?.length) {
        throw new ReverseGeocodingFailedException(
          request.latitude,
          request.longitude,
          'Nenhum resultado encontrado',
        );
      }

      const firstResult = result.results[0];
      if (!firstResult) {
        throw new ReverseGeocodingFailedException(
          request.latitude,
          request.longitude,
          'Nenhum resultado encontrado',
        );
      }

      // Extrair componentes do endereço
      const addressComponents = this.parseAddressComponents(firstResult);

      // Mapear resposta
      const response: IReverseGeocodingResponse = {
        street: addressComponents.street,
        number: addressComponents.number,
        neighborhood: addressComponents.neighborhood,
        city: addressComponents.city ?? '',
        state: addressComponents.state ?? '',
        country: addressComponents.country ?? 'Brasil',
        postal_code: addressComponents.postal_code,
        formatted_address: firstResult.formatted_address,
        provider: 'Google Maps',
        cached: false,
      };

      // Salvar no cache
      await this.cacheReverseGeocodingResult(cacheKey, response);

      this.logger.debug(`Reverse geocoding concluído: ${response.city}/${response.state}`);

      return response;
    } catch (error) {
      this.logger.error(`Erro ao fazer reverse geocoding:`, error);

      if (error instanceof ReverseGeocodingFailedException) {
        throw error;
      }

      throw new ReverseGeocodingFailedException(
        request.latitude,
        request.longitude,
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }

  /**
   * Valida se coordenadas estão dentro dos limites válidos
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    if (!AddressFormatterUtil.validateCoordinates(latitude, longitude)) {
      throw new InvalidCoordinatesException(
        latitude,
        longitude,
        'Coordenadas fora dos limites válidos',
      );
    }
    return true;
  }

  /**
   * Limpa cache de geocoding para um endereço
   */
  async clearGeocodingCache(request: IGeocodingRequest): Promise<void> {
    const cacheKey = this.generateGeocodingCacheKey(request);
    await this.redisService.delete(cacheKey);
    this.logger.debug(`Cache de geocoding removido`);
  }

  /**
   * Limpa cache de reverse geocoding para coordenadas
   */
  async clearReverseGeocodingCache(request: IReverseGeocodingRequest): Promise<void> {
    const cacheKey = this.generateReverseGeocodingCacheKey(request);
    await this.redisService.delete(cacheKey);
    this.logger.debug(`Cache de reverse geocoding removido`);
  }

  /**
   * Valida requisição de geocoding
   */
  private validateGeocodingRequest(request: IGeocodingRequest): void {
    if (!request.street) {
      throw new GeocodingFailedException(undefined, 'Logradouro é obrigatório');
    }

    if (!request.city) {
      throw new GeocodingFailedException(undefined, 'Cidade é obrigatória');
    }

    if (!request.state) {
      throw new GeocodingFailedException(undefined, 'Estado é obrigatório');
    }
  }

  /**
   * Parse componentes do endereço do resultado do Google Maps
   */
  private parseAddressComponents(result: {
    formatted_address: string;
    address_components?: {
      long_name: string;
      short_name: string;
      types: string[];
    }[];
  }): {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  } {
    const components: Record<string, string> = {};

    if (result.address_components) {
      for (const component of result.address_components) {
        if (component.types.includes('route')) {
          components.street = component.long_name;
        }
        if (component.types.includes('street_number')) {
          components.number = component.long_name;
        }
        if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
          components.neighborhood = component.long_name;
        }
        if (
          component.types.includes('locality') ||
          component.types.includes('administrative_area_level_2')
        ) {
          components.city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          components.state = component.short_name;
        }
        if (component.types.includes('country')) {
          components.country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          components.postal_code = component.long_name;
        }
      }
    }

    return components;
  }

  /**
   * Formata endereço para geocoding
   */
  private formatAddressForGeocoding(request: IGeocodingRequest): string {
    const parts: string[] = [];

    if (request.street) {
      parts.push(request.street);
    }
    if (request.number) {
      parts.push(request.number);
    }
    if (request.neighborhood) {
      parts.push(request.neighborhood);
    }
    if (request.city) {
      parts.push(request.city);
    }
    if (request.state) {
      parts.push(request.state);
    }
    if (request.postal_code) {
      parts.push(request.postal_code);
    }
    if (request.country) {
      parts.push(request.country);
    } else {
      parts.push('Brasil');
    }

    return parts.join(', ');
  }

  /**
   * Gera chave de cache para geocoding
   */
  private generateGeocodingCacheKey(request: IGeocodingRequest): string {
    const address = this.formatAddressForGeocoding(request).toLowerCase().replace(/\s+/g, '-');
    return `${CACHE_KEYS.GEOCODING}${address}`;
  }

  /**
   * Gera chave de cache para reverse geocoding
   */
  private generateReverseGeocodingCacheKey(request: IReverseGeocodingRequest): string {
    return `${CACHE_KEYS.REVERSE_GEOCODING}${request.latitude},${request.longitude}`;
  }

  /**
   * Busca resultado de geocoding no cache
   */
  private async getCachedGeocodingResult(cacheKey: string): Promise<IGeocodingResponse | null> {
    try {
      const cached = await this.redisService.get<IGeocodingResponse>(cacheKey);
      return cached ?? null;
    } catch (error) {
      this.logger.warn(`Erro ao buscar geocoding no cache:`, error);
      return null;
    }
  }

  /**
   * Salva resultado de geocoding no cache
   */
  private async cacheGeocodingResult(cacheKey: string, result: IGeocodingResponse): Promise<void> {
    try {
      await this.redisService.set(cacheKey, result, CACHE_TTL.GEOCODING);
      this.logger.debug(`Geocoding salvo no cache por ${CACHE_TTL.GEOCODING}s`);
    } catch (error) {
      this.logger.warn(`Erro ao salvar geocoding no cache:`, error);
    }
  }

  /**
   * Busca resultado de reverse geocoding no cache
   */
  private async getCachedReverseGeocodingResult(
    cacheKey: string,
  ): Promise<IReverseGeocodingResponse | null> {
    try {
      const cached = await this.redisService.get<IReverseGeocodingResponse>(cacheKey);
      return cached ?? null;
    } catch (error) {
      this.logger.warn(`Erro ao buscar reverse geocoding no cache:`, error);
      return null;
    }
  }

  /**
   * Salva resultado de reverse geocoding no cache
   */
  private async cacheReverseGeocodingResult(
    cacheKey: string,
    result: IReverseGeocodingResponse,
  ): Promise<void> {
    try {
      await this.redisService.set(cacheKey, result, CACHE_TTL.REVERSE_GEOCODING);
      this.logger.debug(`Reverse geocoding salvo no cache por ${CACHE_TTL.REVERSE_GEOCODING}s`);
    } catch (error) {
      this.logger.warn(`Erro ao salvar reverse geocoding no cache:`, error);
    }
  }
}
