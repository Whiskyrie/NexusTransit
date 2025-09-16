/**
 * Configurações de rate limiting por role
 * Define limites específicos para cada tipo de usuário baseado na hierarquia organizacional
 */
export enum RoleLimits {
  /** Administradores: 1000 requests por minuto - Acesso total ao sistema */
  ADMIN = 1000,

  /** Gestores: 800 requests por minuto - Gerenciamento operacional */
  GESTOR = 800,

  /** Despachantes: 600 requests por minuto - Coordenação de rotas */
  DESPACHANTE = 600,

  /** Motoristas: 400 requests por minuto - Operações de campo */
  MOTORISTA = 400,

  /** Clientes: 100 requests por minuto - Consultas e solicitações */
  CLIENTE = 100,

  /** Usuários não autenticados: 20 requests por minuto - Acesso básico */
  GUEST = 20,
}
