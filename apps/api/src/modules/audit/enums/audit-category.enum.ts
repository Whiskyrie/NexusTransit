/**
 * Categorias de auditoria do sistema
 *
 * Agrupa logs de auditoria por contexto funcional,
 * facilitando análise e relatórios
 */
export enum AuditCategory {
  /**
   * Autenticação e autorização
   *
   * Eventos relacionados a login, logout, permissões e sessões
   *
   * @example
   * - Login de usuário
   * - Logout do sistema
   * - Tentativa de acesso negado
   * - Alteração de senha
   * - Expiração de token
   */
  AUTH = 'AUTH',

  /**
   * Gerenciamento de usuários
   *
   * Operações CRUD em usuários, perfis e roles
   *
   * @example
   * - Criação de novo usuário
   * - Atualização de dados de perfil
   * - Alteração de permissões
   * - Exclusão de conta
   * - Atribuição de roles
   */
  USER_MANAGEMENT = 'USER_MANAGEMENT',

  /**
   * Gerenciamento de veículos
   *
   * Operações relacionadas à frota de veículos
   *
   * @example
   * - Cadastro de novo veículo
   * - Atualização de status do veículo
   * - Manutenção agendada
   * - Exclusão de veículo
   * - Alteração de documentação
   */
  VEHICLE_MANAGEMENT = 'VEHICLE_MANAGEMENT',

  /**
   * Gerenciamento de rotas
   *
   * Operações em rotas de entrega e logística
   *
   * @example
   * - Criação de nova rota
   * - Otimização de rota
   * - Atualização de paradas
   * - Cancelamento de rota
   * - Reatribuição de motorista
   */
  ROUTE_MANAGEMENT = 'ROUTE_MANAGEMENT',

  /**
   * Gerenciamento de entregas
   *
   * Operações de entregas e pedidos
   *
   * @example
   * - Criação de entrega
   * - Atualização de status
   * - Tentativa de entrega
   * - Confirmação de recebimento
   * - Cancelamento de pedido
   */
  DELIVERY_MANAGEMENT = 'DELIVERY_MANAGEMENT',

  /**
   * Gerenciamento de clientes
   *
   * Operações relacionadas aos clientes
   *
   * @example
   * - Cadastro de cliente
   * - Atualização de endereço
   * - Gestão de preferências
   * - Histórico de pedidos
   * - Exclusão de cadastro
   */
  CUSTOMER_MANAGEMENT = 'CUSTOMER_MANAGEMENT',

  /**
   * Gerenciamento de motoristas
   *
   * Operações relacionadas aos motoristas
   *
   * @example
   * - Cadastro de motorista
   * - Atualização de CNH
   * - Gestão de documentos
   * - Alteração de status
   * - Histórico de entregas
   */
  DRIVER_MANAGEMENT = 'DRIVER_MANAGEMENT',

  /**
   * Gerenciamento de incidentes
   *
   * Operações relacionadas a ocorrências e problemas
   *
   * @example
   * - Registro de incidente
   * - Atualização de gravidade
   * - Resolução de problema
   * - Análise de causa raiz
   * - Medidas corretivas
   */
  INCIDENT_MANAGEMENT = 'INCIDENT_MANAGEMENT',

  /**
   * Operações de sistema
   *
   * Eventos gerais e administrativos do sistema
   *
   * @example
   * - Configurações do sistema
   * - Tarefas agendadas
   * - Limpeza de logs
   * - Backup de dados
   * - Manutenção programada
   */
  SYSTEM = 'SYSTEM',
}
