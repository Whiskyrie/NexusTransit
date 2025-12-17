/**
 * DriverAssignmentStatus Enum - Status de associação de motorista
 *
 * Define os possíveis status da associação entre motorista e veículo
 */
export enum DriverAssignmentStatus {
  /**
   * Ativo - Associação ativa
   */
  ACTIVE = 'active',

  /**
   * Inativo - Associação inativa
   */
  INACTIVE = 'inactive',

  /**
   * Pendente - Associação pendente de aprovação
   */
  PENDING = 'pending',
}
