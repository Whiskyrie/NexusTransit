/**
 * Tipos de consentimento LGPD
 * Define os diferentes tipos de consentimento que podem ser solicitados aos usuários
 */
export enum ConsentType {
  /** Consentimento para processamento de dados pessoais básicos */
  BASIC_DATA_PROCESSING = 'basic_data_processing',

  /** Consentimento para comunicações de marketing */
  MARKETING_COMMUNICATIONS = 'marketing_communications',

  /** Consentimento para análise de dados e melhorias do serviço */
  ANALYTICS_AND_IMPROVEMENTS = 'analytics_and_improvements',

  /** Consentimento para compartilhamento com parceiros */
  THIRD_PARTY_SHARING = 'third_party_sharing',

  /** Consentimento para geolocalização em tempo real */
  LOCATION_TRACKING = 'location_tracking',

  /** Consentimento para notificações push */
  PUSH_NOTIFICATIONS = 'push_notifications',
}
