/**
 * Tipos de solicitação de dados LGPD
 * Define os tipos de solicitações que os usuários podem fazer sobre seus dados
 */
export enum DataRequestType {
  /** Solicitação de portabilidade - exportar dados em formato estruturado */
  DATA_PORTABILITY = 'data_portability',

  /** Solicitação de exclusão - apagar todos os dados pessoais */
  DATA_ERASURE = 'data_erasure',

  /** Solicitação de acesso - visualizar dados coletados */
  DATA_ACCESS = 'data_access',

  /** Solicitação de correção - corrigir dados incorretos */
  DATA_CORRECTION = 'data_correction',

  /** Solicitação de revogação de consentimento */
  CONSENT_REVOCATION = 'consent_revocation',
}
