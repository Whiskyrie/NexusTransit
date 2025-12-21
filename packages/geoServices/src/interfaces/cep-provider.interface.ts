import type { ViaCepAddress } from "./viacep.interface";

/**
 * Interface comum para todos os provedores de consulta de CEP
 *
 * Garante que todos os serviços implementem os métodos necessários
 * para o sistema de fallback funcionar corretamente
 */
export interface CepProvider {
  /**
   * Nome identificador do provedor
   * Usado para logs e métricas
   */
  readonly name: string;

  /**
   * Prioridade do provedor (menor = maior prioridade)
   * 1 = Principal, 2 = Backup primário, 3 = Backup secundário
   */
  readonly priority: number;

  /**
   * Timeout em milissegundos para requisições deste provedor
   */
  readonly timeout: number;

  /**
   * Consulta endereço por CEP
   * @param zipCode CEP a ser consultado (com ou sem formatação)
   * @returns Promise com dados do endereço no formato padrão
   * @throws BadRequestException - CEP inválido
   * @throws NotFoundException - CEP não encontrado
   * @throws ServiceUnavailableException - Serviço indisponível
   */
  getAddressByZipCode(zipCode: string): Promise<ViaCepAddress>;

  /**
   * Valida formato do CEP
   * @param zipCode CEP a ser validado
   * @returns true se válido, false caso contrário
   */
  validateZipCode(zipCode: string): boolean;

  /**
   * Verifica se o provedor está habilitado
   * Útil para habilitar/desabilitar provedores via configuração
   */
  isEnabled(): boolean;
}

/**
 * Estatísticas de uso de um provedor
 */
export interface ProviderStats {
  providerName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsed: Date;
}
