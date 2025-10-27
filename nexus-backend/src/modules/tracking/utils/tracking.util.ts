import { TRACKING_CONSTANTS } from '../constants/tracking.constants';

/**
 * Utilitários para cálculos de rastreamento
 */
export class TrackingUtils {
  /**
   * Calcula a distância entre dois pontos GPS usando a fórmula de Haversine
   * @param lat1 Latitude do ponto 1
   * @param lon1 Longitude do ponto 1
   * @param lat2 Latitude do ponto 2
   * @param lon2 Longitude do ponto 2
   * @returns Distância em quilômetros
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arredonda para 2 casas decimais
  }

  /**
   * Calcula o bearing (direção) entre dois pontos GPS
   * @param lat1 Latitude do ponto 1
   * @param lon1 Longitude do ponto 1
   * @param lat2 Latitude do ponto 2
   * @param lon2 Longitude do ponto 2
   * @returns Bearing em graus (0-360)
   */
  static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = this.toDegrees(Math.atan2(y, x));
    bearing = (bearing + 360) % 360; // Normaliza para 0-360

    return Math.round(bearing * 100) / 100;
  }

  /**
   * Valida se as coordenadas são válidas
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= TRACKING_CONSTANTS.COORDINATES.MIN_LATITUDE &&
      latitude <= TRACKING_CONSTANTS.COORDINATES.MAX_LATITUDE &&
      longitude >= TRACKING_CONSTANTS.COORDINATES.MIN_LONGITUDE &&
      longitude <= TRACKING_CONSTANTS.COORDINATES.MAX_LONGITUDE
    );
  }

  /**
   * Valida se a velocidade é realista
   */
  static validateSpeed(speed: number): boolean {
    return (
      speed >= TRACKING_CONSTANTS.SPEED.MIN_SPEED && speed <= TRACKING_CONSTANTS.SPEED.MAX_SPEED
    );
  }

  /**
   * Detecta se o veículo está parado baseado na velocidade
   */
  static isVehicleStopped(speed: number): boolean {
    return speed < TRACKING_CONSTANTS.STOP_DETECTION.MIN_SPEED_FOR_STOP;
  }

  /**
   * Valida se a distância entre dois pontos é realista
   */
  static validateDistanceBetweenPoints(distance: number, timeInSeconds: number): boolean {
    if (timeInSeconds <= 0) {
      return false;
    }

    // Calcula velocidade média (km/h)
    const avgSpeed = (distance / timeInSeconds) * 3600;

    return avgSpeed <= TRACKING_CONSTANTS.SPEED.MAX_SPEED;
  }

  /**
   * Converte graus para radianos
   */
  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Converte radianos para graus
   */
  private static toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * Formata coordenadas para exibição
   */
  static formatCoordinates(latitude: number, longitude: number): string {
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'E' : 'W';

    return `${Math.abs(latitude).toFixed(6)}°${latDir}, ${Math.abs(longitude).toFixed(6)}°${lonDir}`;
  }

  /**
   * Converte direção em graus para direção cardinal
   */
  static degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index] ?? 'N';
  }

  /**
   * Calcula a velocidade média entre dois pontos
   */
  static calculateAverageSpeed(distance: number, timeInSeconds: number): number {
    if (timeInSeconds <= 0) {
      return 0;
    }

    // Retorna em km/h
    const speedKmh = (distance / timeInSeconds) * 3600;
    return Math.round(speedKmh * 100) / 100;
  }

  /**
   * Determina se a precisão GPS é aceitável
   */
  static isAccuracyAcceptable(accuracy: number): boolean {
    return accuracy <= TRACKING_CONSTANTS.ACCURACY.ACCEPTABLE_ACCURACY;
  }

  /**
   * Determina se a precisão GPS é boa
   */
  static isAccuracyGood(accuracy: number): boolean {
    return accuracy <= TRACKING_CONSTANTS.ACCURACY.GOOD_ACCURACY;
  }

  /**
   * Calcula o ponto médio entre duas coordenadas
   */
  static getMidpoint(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): { latitude: number; longitude: number } {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    const lon1Rad = this.toRadians(lon1);

    const Bx = Math.cos(lat2Rad) * Math.cos(dLon);
    const By = Math.cos(lat2Rad) * Math.sin(dLon);

    const lat3 = Math.atan2(
      Math.sin(lat1Rad) + Math.sin(lat2Rad),
      Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By),
    );
    const lon3 = lon1Rad + Math.atan2(By, Math.cos(lat1Rad) + Bx);

    return {
      latitude: this.toDegrees(lat3),
      longitude: this.toDegrees(lon3),
    };
  }

  /**
   * Verifica se um ponto está dentro de um raio de outro ponto
   */
  static isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusInKm: number,
  ): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusInKm;
  }

  /**
   * Normaliza ângulo de heading para range 0-360
   */
  static normalizeHeading(heading: number): number {
    let normalized = heading % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    return normalized;
  }
}
