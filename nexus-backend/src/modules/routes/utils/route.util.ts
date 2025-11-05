/**
 * Route Utils
 *
 * Funções utilitárias para manipulação e cálculo de dados de rotas.
 *
 * Fornece métodos para:
 * - Cálculo de métricas (distância, tempo, custo)
 * - Formatação de códigos de rota
 * - Validação de dados
 * - Normalização de coordenadas
 *
 * @module Routes/Utils
 */

import type {
  RouteMetrics,
  Coordinates,
  RouteTypeCharacteristics,
} from '../interfaces/route-metrics.interface';
import type { RouteType } from '../enums/route-type';

/**
 * Constantes para cálculos de rotas
 */
const ROUTE_CALCULATION_CONSTANTS = {
  /**
   * Custo padrão por quilômetro em reais
   */
  DEFAULT_COST_PER_KM: 2.0,

  /**
   * Velocidade média padrão em km/h
   */
  DEFAULT_AVG_SPEED: 60,

  /**
   * Fator de atraso padrão (15%)
   */
  DEFAULT_DELAY_FACTOR: 1.15,

  /**
   * Precisão de coordenadas (casas decimais)
   */
  COORDINATES_PRECISION: 6,

  /**
   * Prefixo padrão para códigos de rota
   */
  ROUTE_CODE_PREFIX: 'RT',

  /**
   * Tamanho do número sequencial no código
   */
  ROUTE_CODE_SEQUENCE_LENGTH: 6,
} as const;

/**
 * Características por tipo de rota
 */
const ROUTE_TYPE_CHARACTERISTICS: Record<RouteType, RouteTypeCharacteristics> = {
  URBAN: {
    avgSpeed: 40,
    delayFactor: 1.25, // 25% de atraso
    costPerKm: 2.5,
  },
  INTERSTATE: {
    avgSpeed: 90,
    delayFactor: 1.1, // 10% de atraso
    costPerKm: 1.8,
  },
  RURAL: {
    avgSpeed: 60,
    delayFactor: 1.4, // 40% de atraso
    costPerKm: 2.2,
  },
  EXPRESS: {
    avgSpeed: 100,
    delayFactor: 1.0, // Sem atraso
    costPerKm: 3.0,
  },
  LOCAL: {
    avgSpeed: 30,
    delayFactor: 1.2, // 20% de atraso
    costPerKm: 2.8,
  },
};

/**
 * Classe utilitária para rotas
 *
 * Métodos estáticos para cálculos e manipulação de dados de rotas
 */
export class RouteUtils {
  /**
   * Calcula métricas de uma rota
   *
   * @param distance - Distância em quilômetros
   * @param avgSpeed - Velocidade média em km/h (opcional)
   * @param delayFactor - Fator de atraso multiplicador (opcional)
   * @param costPerKm - Custo por quilômetro (opcional)
   * @returns Objeto com métricas calculadas
   *
   * @example
   * ```typescript
   * const metrics = RouteUtils.calculateRouteMetrics(150, 80, 1.15);
   * console.log(metrics.duration); // 129.375 minutos
   * console.log(metrics.estimatedCost); // R$ 300.00
   * ```
   */
  static calculateRouteMetrics(
    distance: number,
    avgSpeed: number = ROUTE_CALCULATION_CONSTANTS.DEFAULT_AVG_SPEED,
    delayFactor: number = ROUTE_CALCULATION_CONSTANTS.DEFAULT_DELAY_FACTOR,
    costPerKm: number = ROUTE_CALCULATION_CONSTANTS.DEFAULT_COST_PER_KM,
  ): RouteMetrics {
    // Validar inputs
    if (distance < 0) {
      throw new Error('Distância não pode ser negativa');
    }
    if (avgSpeed <= 0) {
      throw new Error('Velocidade média deve ser maior que zero');
    }
    if (delayFactor < 1) {
      throw new Error('Fator de atraso deve ser maior ou igual a 1');
    }

    // Calcular duração em minutos
    // Fórmula: (distância / velocidade) * 60 * fator_atraso
    const baseTimeHours = distance / avgSpeed;
    const duration = baseTimeHours * 60 * delayFactor;

    // Calcular custo estimado
    const estimatedCost = distance * costPerKm;

    return {
      distance,
      duration: Math.round(duration * 100) / 100, // 2 casas decimais
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      calculatedAt: new Date(),
      avgSpeed,
      delayFactor,
    };
  }

  /**
   * Calcula métricas baseado no tipo de rota
   *
   * @param distance - Distância em quilômetros
   * @param routeType - Tipo da rota
   * @returns Objeto com métricas calculadas
   *
   * @example
   * ```typescript
   * const metrics = RouteUtils.calculateMetricsByType(150, RouteType.INTERSTATE);
   * ```
   */
  static calculateMetricsByType(distance: number, routeType: RouteType): RouteMetrics {
    const characteristics = this.getRouteTypeCharacteristics(routeType);

    return this.calculateRouteMetrics(
      distance,
      characteristics.avgSpeed,
      characteristics.delayFactor,
      characteristics.costPerKm,
    );
  }

  /**
   * Formata código de rota no padrão RT-XXXXXX
   *
   * @param prefix - Prefixo do código (padrão: 'RT')
   * @param sequence - Número sequencial
   * @returns Código formatado
   *
   * @example
   * ```typescript
   * RouteUtils.formatRouteCode('RT', 42); // 'RT-000042'
   * RouteUtils.formatRouteCode('RT', 123456); // 'RT-123456'
   * ```
   */
  static formatRouteCode(
    prefix: string = ROUTE_CALCULATION_CONSTANTS.ROUTE_CODE_PREFIX,
    sequence: number,
  ): string {
    if (sequence < 0) {
      throw new Error('Sequência não pode ser negativa');
    }

    const paddedSequence = sequence
      .toString()
      .padStart(ROUTE_CALCULATION_CONSTANTS.ROUTE_CODE_SEQUENCE_LENGTH, '0');

    return `${prefix}-${paddedSequence}`;
  }

  /**
   * Normaliza coordenadas geográficas
   *
   * Limita a precisão e valida ranges
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Objeto com coordenadas normalizadas
   * @throws Error se coordenadas inválidas
   *
   * @example
   * ```typescript
   * RouteUtils.normalizeCoordinates(-23.5505199, -46.6333094);
   * // { latitude: -23.55052, longitude: -46.633309 }
   * ```
   */
  static normalizeCoordinates(lat: number, lng: number): Coordinates {
    // Validar ranges
    if (lat < -90 || lat > 90) {
      throw new Error(`Latitude inválida: ${lat}. Deve estar entre -90 e 90`);
    }
    if (lng < -180 || lng > 180) {
      throw new Error(`Longitude inválida: ${lng}. Deve estar entre -180 e 180`);
    }

    const precision = ROUTE_CALCULATION_CONSTANTS.COORDINATES_PRECISION;

    return {
      latitude: parseFloat(lat.toFixed(precision)),
      longitude: parseFloat(lng.toFixed(precision)),
    };
  }

  /**
   * Converte string de coordenadas para objeto
   *
   * Aceita formatos: "lat,lng" ou JSON
   *
   * @param coordinates - String com coordenadas
   * @returns Objeto com coordenadas normalizadas
   *
   * @example
   * ```typescript
   * RouteUtils.parseCoordinates("-23.5505199,-46.6333094");
   * RouteUtils.parseCoordinates('{"latitude": -23.5505199, "longitude": -46.6333094}');
   * ```
   */
  static parseCoordinates(coordinates: string): Coordinates {
    try {
      // Tentar parser como JSON
      const parsed = JSON.parse(coordinates) as { latitude?: number; longitude?: number };
      if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return this.normalizeCoordinates(parsed.latitude, parsed.longitude);
      }
    } catch {
      // Se não for JSON, tentar formato "lat,lng"
      const parts = coordinates.split(',').map(s => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return this.normalizeCoordinates(lat, lng);
        }
      }
    }

    throw new Error(`Formato de coordenadas inválido: ${coordinates}`);
  }

  /**
   * Formata coordenadas para string "lat,lng"
   *
   * @param coordinates - Objeto com coordenadas
   * @returns String formatada
   *
   * @example
   * ```typescript
   * RouteUtils.formatCoordinates({ latitude: -23.55052, longitude: -46.633309 });
   * // "-23.55052,-46.633309"
   * ```
   */
  static formatCoordinates(coordinates: Coordinates): string {
    return `${coordinates.latitude},${coordinates.longitude}`;
  }

  /**
   * Valida dados básicos de uma rota
   *
   * @param routeData - Dados da rota para validar
   * @returns true se válido
   * @throws Error com mensagem descritiva se inválido
   *
   * @example
   * ```typescript
   * RouteUtils.validateRouteData({
   *   route_code: 'RT-000001',
   *   distance_km: 150,
   *   planned_date: new Date(),
   * });
   * ```
   */
  static validateRouteData(routeData: {
    route_code?: string;
    distance_km?: number;
    planned_date?: Date;
    total_load_kg?: number;
    total_volume_m3?: number;
  }): boolean {
    const errors: string[] = [];

    // Validar código
    if (routeData.route_code && !this.isValidRouteCode(routeData.route_code)) {
      errors.push(`Código de rota inválido: ${routeData.route_code}`);
    }

    // Validar distância
    if (routeData.distance_km !== undefined && routeData.distance_km < 0) {
      errors.push('Distância não pode ser negativa');
    }

    // Validar data
    if (routeData.planned_date && routeData.planned_date < new Date()) {
      errors.push('Data planejada não pode ser no passado');
    }

    // Validar carga
    if (routeData.total_load_kg !== undefined && routeData.total_load_kg < 0) {
      errors.push('Carga não pode ser negativa');
    }

    // Validar volume
    if (routeData.total_volume_m3 !== undefined && routeData.total_volume_m3 < 0) {
      errors.push('Volume não pode ser negativo');
    }

    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join('; ')}`);
    }

    return true;
  }

  /**
   * Verifica se código de rota está no formato correto
   *
   * @param code - Código para validar
   * @returns true se válido
   *
   * @example
   * ```typescript
   * RouteUtils.isValidRouteCode('RT-000042'); // true
   * RouteUtils.isValidRouteCode('INVALID'); // false
   * ```
   */
  static isValidRouteCode(code: string): boolean {
    const pattern = /^[A-Z]{2,4}-\d{6,}$/;
    return pattern.test(code);
  }

  /**
   * Obtém características de um tipo de rota
   *
   * @param routeType - Tipo da rota
   * @returns Características operacionais
   *
   * @example
   * ```typescript
   * const chars = RouteUtils.getRouteTypeCharacteristics(RouteType.URBAN);
   * console.log(chars.avgSpeed); // 40
   * ```
   */
  static getRouteTypeCharacteristics(routeType: RouteType): RouteTypeCharacteristics {
    return ROUTE_TYPE_CHARACTERISTICS[routeType];
  }

  /**
   * Calcula distância entre dois pontos (fórmula de Haversine)
   *
   * @param from - Coordenadas de origem
   * @param to - Coordenadas de destino
   * @returns Distância em quilômetros
   *
   * @example
   * ```typescript
   * const origin = { latitude: -23.5505, longitude: -46.6333 };
   * const destination = { latitude: -22.9068, longitude: -43.1729 };
   * const distance = RouteUtils.calculateDistance(origin, destination);
   * console.log(distance); // ~357 km
   * ```
   */
  static calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Raio da Terra em km

    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 2 casas decimais
  }

  /**
   * Converte graus para radianos
   *
   * @param degrees - Ângulo em graus
   * @returns Ângulo em radianos
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
