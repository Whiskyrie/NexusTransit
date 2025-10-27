/**
 * Enum para tipos de eventos de rastreamento
 *
 * Define os diferentes eventos que podem gerar um ponto de rastreamento
 */
export enum TrackingEventType {
  /** Início de uma rota */
  ROUTE_START = 'inicio_rota',

  /** Fim de uma rota */
  ROUTE_END = 'fim_rota',

  /** Início de uma entrega */
  DELIVERY_START = 'inicio_entrega',

  /** Fim de uma entrega */
  DELIVERY_END = 'fim_entrega',

  /** Coleta realizada */
  PICKUP = 'coleta',

  /** Parada programada ou não programada */
  STOP = 'parada',

  /** Abastecimento */
  FUEL = 'abastecimento',

  /** Manutenção */
  MAINTENANCE = 'manutencao',

  /** Checkpoint de rota */
  CHECKPOINT = 'checkpoint',

  /** Emergência ou incidente */
  EMERGENCY = 'emergencia',

  /** Ponto manual registrado pelo motorista */
  MANUAL = 'manual',

  /** Ponto automático do sistema GPS */
  AUTOMATIC = 'automatico',

  /** Entrada em zona/geofence */
  GEOFENCE_ENTRY = 'entrada_zona',

  /** Saída de zona/geofence */
  GEOFENCE_EXIT = 'saida_zona',
}

/**
 * Descrições dos tipos de evento para exibição em UI
 */
export const TrackingEventTypeDescriptions: Record<TrackingEventType, string> = {
  [TrackingEventType.ROUTE_START]: 'Início da Rota',
  [TrackingEventType.ROUTE_END]: 'Fim da Rota',
  [TrackingEventType.DELIVERY_START]: 'Início da Entrega',
  [TrackingEventType.DELIVERY_END]: 'Fim da Entrega',
  [TrackingEventType.PICKUP]: 'Coleta Realizada',
  [TrackingEventType.STOP]: 'Parada',
  [TrackingEventType.FUEL]: 'Abastecimento',
  [TrackingEventType.MAINTENANCE]: 'Manutenção',
  [TrackingEventType.CHECKPOINT]: 'Checkpoint',
  [TrackingEventType.EMERGENCY]: 'Emergência',
  [TrackingEventType.MANUAL]: 'Registro Manual',
  [TrackingEventType.AUTOMATIC]: 'Registro Automático',
  [TrackingEventType.GEOFENCE_ENTRY]: 'Entrada em Zona',
  [TrackingEventType.GEOFENCE_EXIT]: 'Saída de Zona',
};

/**
 * Enum para tipos de dispositivos de rastreamento
 */
export enum DeviceType {
  /** Rastreador GPS dedicado */
  GPS_TRACKER = 'GPS',

  /** Aplicativo móvel (smartphone) */
  MOBILE_APP = 'Mobile',

  /** Tablet */
  TABLET = 'Tablet',

  /** Dispositivo OBD (On-Board Diagnostics) */
  OBD = 'OBD',

  /** Rastreamento via satélite */
  SATELLITE = 'Satellite',

  /** Outro tipo de dispositivo */
  OTHER = 'Other',
}

/**
 * Enum para níveis de qualidade do sinal GPS
 */
export enum SignalQuality {
  /** Sem sinal */
  NO_SIGNAL = 'NO_SIGNAL',

  /** Sinal fraco (< 30%) */
  WEAK = 'WEAK',

  /** Sinal moderado (30-70%) */
  MODERATE = 'MODERATE',

  /** Sinal bom (> 70%) */
  GOOD = 'GOOD',

  /** Sinal excelente (> 90%) */
  EXCELLENT = 'EXCELLENT',
}

/**
 * Função utilitária para determinar qualidade do sinal
 */
export function getSignalQuality(strength: number): SignalQuality {
  if (strength <= 0) {
    return SignalQuality.NO_SIGNAL;
  }
  if (strength < 30) {
    return SignalQuality.WEAK;
  }
  if (strength < 70) {
    return SignalQuality.MODERATE;
  }
  if (strength < 90) {
    return SignalQuality.GOOD;
  }
  return SignalQuality.EXCELLENT;
}

/**
 * Enum para níveis de precisão do GPS
 */
export enum AccuracyLevel {
  /** Precisão muito baixa (> 100m) */
  VERY_LOW = 'VERY_LOW',

  /** Precisão baixa (50-100m) */
  LOW = 'LOW',

  /** Precisão aceitável (20-50m) */
  ACCEPTABLE = 'ACCEPTABLE',

  /** Precisão boa (10-20m) */
  GOOD = 'GOOD',

  /** Precisão excelente (< 10m) */
  EXCELLENT = 'EXCELLENT',
}

/**
 * Função utilitária para determinar nível de precisão
 */
export function getAccuracyLevel(accuracy: number): AccuracyLevel {
  if (accuracy > 100) {
    return AccuracyLevel.VERY_LOW;
  }
  if (accuracy > 50) {
    return AccuracyLevel.LOW;
  }
  if (accuracy > 20) {
    return AccuracyLevel.ACCEPTABLE;
  }
  if (accuracy > 10) {
    return AccuracyLevel.GOOD;
  }
  return AccuracyLevel.EXCELLENT;
}
