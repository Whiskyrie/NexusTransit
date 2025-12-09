/**
 * Interface para usuário autenticado na requisição
 * Usado nos interceptors e guards
 */
export interface RequestUser {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
}
