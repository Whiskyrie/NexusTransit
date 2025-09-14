/**
 * Status das solicitações de dados LGPD
 * Define os possíveis status de uma solicitação de dados do usuário
 */
export enum DataRequestStatus {
  /** Solicitação criada e aguardando processamento */
  PENDING = 'pending',

  /** Solicitação em processamento */
  PROCESSING = 'processing',

  /** Solicitação concluída com sucesso */
  COMPLETED = 'completed',

  /** Solicitação falhou devido a erro */
  FAILED = 'failed',

  /** Solicitação cancelada pelo usuário */
  CANCELLED = 'cancelled',

  /** Solicitação expirou (não processada no prazo legal) */
  EXPIRED = 'expired',
}
