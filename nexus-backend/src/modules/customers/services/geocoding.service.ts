import { Injectable, BadRequestException } from '@nestjs/common';
import { NominatimSearchResult, NominatimReverseResult } from '../types/geocoding.types';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Injectable()
export class GeocodingService {
  async geocodeAddress(address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<GeocodingResult> {
    const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}, ${address.zipCode}`;

    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'NexusTransit/1.0',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = (await response.json()) as NominatimSearchResult[];

      if (!data || data.length === 0) {
        throw new BadRequestException('Endereço não encontrado para geocodificação');
      }

      const result = data[0];

      if (!result) {
        throw new BadRequestException('Endereço não encontrado para geocodificação');
      }

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao geocodificar endereço. Tente novamente.');
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<Pick<GeocodingResult, 'formattedAddress'>> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'NexusTransit/1.0',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding service unavailable');
      }

      const data = (await response.json()) as NominatimReverseResult;

      if (!data || data.error || !data.display_name) {
        throw new BadRequestException('Coordenadas não encontradas');
      }

      return {
        formattedAddress: data.display_name,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar endereço pelas coordenadas. Tente novamente.');
    }
  }
}
