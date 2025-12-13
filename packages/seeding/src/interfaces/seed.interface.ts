/**
 * Interface base para seeds
 *
 * Todos os seeds devem implementar esta interface
 */
export interface ISeed {
  /**
   * Executa o seed
   *
   * Deve ser idempotente - executar múltiplas vezes não deve duplicar dados
   */
  run(): Promise<void>;
}
