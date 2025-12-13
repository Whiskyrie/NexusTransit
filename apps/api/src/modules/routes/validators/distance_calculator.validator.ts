import { Injectable, Logger } from '@nestjs/common';
import { getDistance } from 'geolib';
import type { GeolibInputCoordinates } from 'geolib/es/types';

/**
 * Service para cálculo de distâncias e métricas de rota
 *
 * Usa biblioteca geolib para cálculos geográficos
 * Precisão: < 5% de erro conforme requisito
 */
@Injectable()
export class DistanceCalculatorService {
  private readonly logger = new Logger(DistanceCalculatorService.name);

  /**
   * Calcula distância entre duas coordenadas (em km)
   *
   * @param origin Coordenadas de origem "POINT(lat lng)"
   * @param destination Coordenadas de destino "POINT(lat lng)"
   * @returns Distância em quilômetros
   */
  calculateDistance(origin: string, destination: string): number {
    try {
      const originCoords = this.parseCoordinates(origin);
      const destCoords = this.parseCoordinates(destination);

      // getDistance retorna distância em metros (sempre número)
      const distanceMeters: number = getDistance(originCoords, destCoords);

      // Validar se o resultado é um número válido
      if (typeof distanceMeters !== 'number' || distanceMeters === null || isNaN(distanceMeters)) {
        this.logger.warn('Não foi possível calcular distância entre coordenadas');
        return 0;
      }

      // Converter para km e arredondar com 2 casas decimais
      return Math.round((distanceMeters / 1000) * 100) / 100;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao calcular distância:', errorMessage);
      return 0;
    }
  }

  /**
   * Calcula distância total de uma rota com múltiplas paradas
   *
   * @param coordinates Array de coordenadas "POINT(lat lng)"
   * @returns Distância total em km
   */
  calculateTotalDistance(coordinates: string[]): number {
    if (coordinates.length < 2) {
      return 0;
    }

    let totalDistance = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const current = coordinates[i];
      const next = coordinates[i + 1];

      // Garantir que as coordenadas existem
      if (!current || !next) {
        this.logger.warn(`Coordenada inválida no índice ${i}`);
        continue;
      }

      const segmentDistance = this.calculateDistance(current, next);
      totalDistance += segmentDistance;
    }

    return Math.round(totalDistance * 100) / 100;
  }

  /**
   * Calcula tempo estimado baseado em distância e velocidade média
   *
   * @param distanceKm Distância em km
   * @param avgSpeedKmh Velocidade média (padrão: 50 km/h urbano)
   * @param delayFactor Fator de atraso (1.0 = sem atraso, 1.3 = 30% atraso)
   * @returns Tempo em minutos
   */
  calculateEstimatedDuration(distanceKm: number, avgSpeedKmh = 50, delayFactor = 1.2): number {
    if (distanceKm <= 0 || avgSpeedKmh <= 0) {
      return 0;
    }

    // Tempo = distância / velocidade (em horas)
    const timeHours = distanceKm / avgSpeedKmh;

    // Converter para minutos e aplicar fator de atraso
    const timeMinutes = timeHours * 60 * delayFactor;

    return Math.ceil(timeMinutes);
  }

  /**
   * Calcula consumo estimado de combustível
   *
   * @param distanceKm Distância em km
   * @param vehicleConsumption Consumo do veículo (km/l)
   * @returns Litros necessários
   */
  calculateFuelConsumption(
    distanceKm: number,
    vehicleConsumption = 10, // padrão: 10 km/l
  ): number {
    if (distanceKm <= 0 || vehicleConsumption <= 0) {
      return 0;
    }

    const liters = distanceKm / vehicleConsumption;
    return Math.round(liters * 100) / 100;
  }

  /**
   * Calcula custo estimado de combustível
   *
   * @param distanceKm Distância em km
   * @param vehicleConsumption Consumo (km/l)
   * @param fuelPricePerLiter Preço por litro
   * @returns Custo estimado
   */
  calculateFuelCost(distanceKm: number, vehicleConsumption = 10, fuelPricePerLiter = 5.5): number {
    const fuelNeeded = this.calculateFuelConsumption(distanceKm, vehicleConsumption);
    const cost = fuelNeeded * fuelPricePerLiter;

    return Math.round(cost * 100) / 100;
  }

  /**
   * Parse coordenadas do formato PostGIS POINT
   *
   * @param point String "POINT(lat lng)"
   * @returns Objeto compatível com geolib
   */
  private parseCoordinates(point: string): GeolibInputCoordinates {
    // Formato: "POINT(-23.561414 -46.656250)"
    const matches = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(point);

    if (!matches || matches.length < 3) {
      throw new Error(`Formato de coordenadas inválido: ${point}`);
    }

    const lat = matches[1];
    const lng = matches[2];

    if (!lat || !lng) {
      throw new Error(`Coordenadas inválidas no ponto: ${point}`);
    }

    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };
  }

  /**
   * Valida se coordenadas estão no formato correto
   */
  validateCoordinates(point: string): boolean {
    try {
      this.parseCoordinates(point);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formata coordenadas para o formato PostGIS POINT
   */
  formatCoordinates(latitude: number, longitude: number): string {
    return `POINT(${latitude} ${longitude})`;
  }
}
