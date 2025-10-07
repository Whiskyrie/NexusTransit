/**
 * Interface para usuário autenticado na requisição
 */
export interface RequestUser {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
}
