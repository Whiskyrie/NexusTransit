import { registerAs } from '@nestjs/config';

/**
 * Configurações do módulo de entregas
 *
 * Centraliza todas as configurações relacionadas a entregas,
 * rastreamento, notificações e otimização de rotas
 */
export const deliveryConfig = registerAs('delivery', () => ({
  /**
   * Configurações de rastreamento
   */
  tracking: {
    /** Prefixo do código de rastreamento */
    codePrefix: process.env.TRACKING_CODE_PREFIX ?? 'NXT',

    /** Tamanho da sequência numérica */
    sequenceLength: Number.parseInt(process.env.TRACKING_SEQUENCE_LENGTH ?? '5', 10),

    /** Intervalo de atualização de localização (segundos) */
    updateIntervalSeconds: Number.parseInt(process.env.TRACKING_UPDATE_INTERVAL ?? '30', 10),

    /** Raio de geofence para detecção de chegada (metros) */
    arrivalRadiusMeters: Number.parseInt(process.env.GEOFENCE_RADIUS ?? '100', 10),

    /** Dias até expiração do código */
    expirationDays: Number.parseInt(process.env.TRACKING_EXPIRATION_DAYS ?? '90', 10),
  },

  /**
   * Limites e restrições
   */
  limits: {
    /** Número máximo de tentativas de entrega */
    maxAttempts: Number.parseInt(process.env.MAX_DELIVERY_ATTEMPTS ?? '3', 10),

    /** Distância máxima de entrega (km) */
    maxDistanceKm: Number.parseInt(process.env.MAX_DELIVERY_DISTANCE ?? '200', 10),

    /** Peso máximo de entrega (kg) */
    maxWeightKg: Number.parseInt(process.env.MAX_DELIVERY_WEIGHT ?? '30', 10),

    /** Número máximo de entregas por rota */
    maxDeliveriesPerRoute: Number.parseInt(process.env.MAX_DELIVERIES_PER_ROUTE ?? '20', 10),

    /** Número máximo de itens por entrega */
    maxItemsPerDelivery: Number.parseInt(process.env.MAX_ITEMS_PER_DELIVERY ?? '50', 10),

    /** Tamanho máximo de imagem (MB) */
    maxImageSizeMb: Number.parseInt(process.env.MAX_IMAGE_SIZE_MB ?? '5', 10),

    /** Tamanho máximo de documento (MB) */
    maxDocumentSizeMb: Number.parseInt(process.env.MAX_DOCUMENT_SIZE_MB ?? '10', 10),
  },

  /**
   * Configurações de janela de tempo
   */
  timeWindow: {
    /** Duração padrão da janela (horas) */
    defaultDurationHours: Number.parseInt(process.env.DEFAULT_WINDOW_HOURS ?? '4', 10),

    /** Duração mínima da janela (minutos) */
    minDurationMinutes: Number.parseInt(process.env.MIN_WINDOW_MINUTES ?? '30', 10),

    /** Duração máxima da janela (horas) */
    maxDurationHours: Number.parseInt(process.env.MAX_WINDOW_HOURS ?? '12', 10),

    /** Tempo mínimo de antecedência para agendamento (horas) */
    minScheduleAdvanceHours: Number.parseInt(process.env.MIN_SCHEDULE_ADVANCE ?? '2', 10),

    /** Tolerância de atraso (minutos) */
    delayToleranceMinutes: Number.parseInt(process.env.DELAY_TOLERANCE_MINUTES ?? '30', 10),
  },

  /**
   * Configurações de notificações
   */
  notifications: {
    /** Habilitar notificações por email */
    enableEmail: process.env.NOTIFICATIONS_EMAIL_ENABLED === 'true',

    /** Habilitar notificações por SMS */
    enableSms: process.env.NOTIFICATIONS_SMS_ENABLED === 'true',

    /** Habilitar notificações push */
    enablePush: process.env.NOTIFICATIONS_PUSH_ENABLED === 'true',

    /** Enviar notificação automática em mudanças de status */
    autoNotifyStatusChange: process.env.AUTO_NOTIFY_STATUS_CHANGE !== 'false',

    /** Enviar notificação de atraso */
    notifyOnDelay: process.env.NOTIFY_ON_DELAY !== 'false',

    /** Limiar de atraso para notificação (minutos) */
    delayThresholdMinutes: Number.parseInt(process.env.DELAY_THRESHOLD_MINUTES ?? '15', 10),
  },

  /**
   * Configurações de otimização de rotas
   */
  routeOptimization: {
    /** Algoritmo de otimização: nearest-neighbor, genetic, ant-colony */
    algorithm: process.env.ROUTE_OPTIMIZATION_ALGORITHM ?? 'nearest-neighbor',

    /** Velocidade média urbana (km/h) */
    averageUrbanSpeed: Number.parseInt(process.env.AVERAGE_URBAN_SPEED ?? '30', 10),

    /** Velocidade média rodoviária (km/h) */
    averageHighwaySpeed: Number.parseInt(process.env.AVERAGE_HIGHWAY_SPEED ?? '80', 10),

    /** Tempo médio de parada (minutos) */
    averageServiceTime: Number.parseInt(process.env.AVERAGE_SERVICE_TIME ?? '15', 10),

    /** Distância para considerar mesma região (km) */
    regionClusteringDistance: Number.parseInt(process.env.REGION_CLUSTERING_DISTANCE ?? '5', 10),

    /** Peso da prioridade na otimização (0-1) */
    priorityWeight: Number.parseFloat(process.env.PRIORITY_WEIGHT ?? '0.3'),

    /** Considerar janelas de tempo na otimização */
    considerTimeWindows: process.env.CONSIDER_TIME_WINDOWS !== 'false',
  },

  /**
   * Configurações de validação
   */
  validation: {
    /** Validar coordenadas dentro do Brasil */
    validateBrazilBounds: process.env.VALIDATE_BRAZIL_BOUNDS !== 'false',

    /** Validar formato de CEP */
    strictCepValidation: process.env.STRICT_CEP_VALIDATION !== 'false',

    /** Validar formato de telefone */
    strictPhoneValidation: process.env.STRICT_PHONE_VALIDATION !== 'false',

    /** Exigir coordenadas no endereço */
    requireCoordinates: process.env.REQUIRE_COORDINATES === 'true',

    /** Exigir assinatura na entrega */
    requireSignature: process.env.REQUIRE_SIGNATURE === 'true',

    /** Exigir foto na entrega */
    requirePhoto: process.env.REQUIRE_PHOTO === 'true',
  },

  /**
   * Configurações de auditoria
   */
  audit: {
    /** Habilitar auditoria automática */
    enabled: process.env.DELIVERY_AUDIT_ENABLED !== 'false',

    /** Incluir valores antigos no log */
    includeOldValues: process.env.AUDIT_INCLUDE_OLD_VALUES !== 'false',

    /** Incluir valores novos no log */
    includeNewValues: process.env.AUDIT_INCLUDE_NEW_VALUES !== 'false',

    /** Incluir mudanças de campos no log */
    includeChangedColumns: process.env.AUDIT_INCLUDE_CHANGED_COLUMNS !== 'false',

    /** Armazenar IP do usuário */
    storeUserIp: process.env.AUDIT_STORE_USER_IP !== 'false',

    /** Armazenar User-Agent */
    storeUserAgent: process.env.AUDIT_STORE_USER_AGENT !== 'false',
  },

  /**
   * Configurações de armazenamento de arquivos
   */
  storage: {
    /** Provedor de armazenamento: local, s3, gcs */
    provider: process.env.STORAGE_PROVIDER ?? 'local',

    /** Diretório base para armazenamento local */
    localBasePath: process.env.STORAGE_LOCAL_PATH ?? './uploads/deliveries',

    /** Bucket S3 para armazenamento */
    s3Bucket: process.env.STORAGE_S3_BUCKET,

    /** Região S3 */
    s3Region: process.env.STORAGE_S3_REGION ?? 'us-east-1',

    /** Bucket GCS */
    gcsBucket: process.env.STORAGE_GCS_BUCKET,

    /** Formatos de imagem aceitos */
    acceptedImageFormats: ['image/jpeg', 'image/png', 'image/webp'],

    /** Formatos de documento aceitos */
    acceptedDocumentFormats: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  /**
   * Configurações de integração
   */
  integrations: {
    /** URL da API de geocodificação */
    geocodingApiUrl: process.env.GEOCODING_API_URL,

    /** Chave da API de geocodificação */
    geocodingApiKey: process.env.GEOCODING_API_KEY,

    /** URL da API de mapas */
    mapsApiUrl: process.env.MAPS_API_URL,

    /** Chave da API de mapas */
    mapsApiKey: process.env.MAPS_API_KEY,

    /** URL do serviço de SMS */
    smsServiceUrl: process.env.SMS_SERVICE_URL,

    /** Chave do serviço de SMS */
    smsServiceKey: process.env.SMS_SERVICE_KEY,

    /** URL do serviço de push */
    pushServiceUrl: process.env.PUSH_SERVICE_URL,

    /** Chave do serviço de push */
    pushServiceKey: process.env.PUSH_SERVICE_KEY,
  },
}));

/**
 * Tipo inferido da configuração
 */
export type DeliveryConfig = ReturnType<typeof deliveryConfig>;
