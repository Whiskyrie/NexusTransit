/**
 * Ações de auditoria suportadas pelo sistema
 *
 * Define todos os tipos de ações que podem ser rastreadas
 * nos logs de auditoria
 */
export enum AuditAction {
  /**
   * Criação de um novo recurso
   *
   * Registrado quando uma entidade é inserida no banco de dados
   *
   * @example
   * - Novo usuário cadastrado
   * - Nova entrega criada
   * - Novo veículo adicionado
   */
  CREATE = 'CREATE',

  /**
   * Leitura/consulta de um recurso
   *
   * Registrado quando dados são acessados via API
   *
   * @example
   * - Listar entregas
   * - Buscar detalhes de um veículo
   * - Consultar perfil de usuário
   */
  READ = 'READ',

  /**
   * Atualização de um recurso existente
   *
   * Registrado quando uma entidade é modificada
   *
   * @example
   * - Atualizar status de entrega
   * - Modificar dados do motorista
   * - Alterar informações do cliente
   */
  UPDATE = 'UPDATE',

  /**
   * Remoção de um recurso
   *
   * Registrado em operações de exclusão (soft delete ou hard delete)
   *
   * @example
   * - Excluir veículo
   * - Remover usuário
   * - Deletar rota
   */
  DELETE = 'DELETE',

  /**
   * Autenticação bem-sucedida
   *
   * Registrado quando um usuário faz login no sistema
   *
   * @example
   * - Login via email/senha
   * - Autenticação com token JWT
   * - Login social (OAuth)
   */
  LOGIN = 'LOGIN',

  /**
   * Encerramento de sessão
   *
   * Registrado quando um usuário faz logout
   *
   * @example
   * - Logout manual do usuário
   * - Expiração de token
   * - Logout forçado por admin
   */
  LOGOUT = 'LOGOUT',

  /**
   * Alteração de senha
   *
   * Registrado quando a senha é modificada
   *
   * @example
   * - Redefinição de senha esquecida
   * - Alteração de senha por configuração
   * - Troca de senha forçada
   */
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  /**
   * Tentativa de autenticação com falha
   *
   * Registrado em tentativas de login inválidas
   *
   * @example
   * - Senha incorreta
   * - Email não encontrado
   * - Conta bloqueada
   * - Token expirado
   */
  FAILED_LOGIN = 'FAILED_LOGIN',

  /**
   * Acesso negado por falta de permissão
   *
   * Registrado quando usuário tenta acessar recurso sem autorização
   *
   * @example
   * - Tentativa de acessar recurso restrito
   * - Ação não permitida para o perfil
   * - Token de acesso inválido
   */
  ACCESS_DENIED = 'ACCESS_DENIED',
}
