import type { UserStatus } from '../enums/user-status.enum';
import type { UserType } from '../enums/user-type.enum';
import type { Role } from '../../auth/entities/role.entity';

/**
 * Interface base do usuário
 */
export interface IUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: UserType;
  status: UserStatus;
  email_verified: boolean;
  email_verified_at?: Date;
  last_login_at?: Date;
  last_activity_at?: Date;
  preferences?: Record<string, unknown>;
  roles?: Role[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * Interface para dados de criação de usuário
 */
export interface ICreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type?: UserType;
  status?: UserStatus;
  preferences?: Record<string, unknown>;
}

/**
 * Interface para dados de atualização de usuário
 */
export interface IUpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type?: UserType;
  status?: UserStatus;
  preferences?: Record<string, unknown>;
}

/**
 * Interface para filtros de busca de usuários
 */
export interface IUserFilters {
  search?: string;
  status?: UserStatus;
  user_type?: UserType;
  email_verified?: boolean;
  created_after?: string;
  created_before?: string;
  page?: number;
  limit?: number;
}

/**
 * Interface para resposta paginada de usuários
 */
export interface IPaginatedUsers {
  data: IUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
  };
}

/**
 * Contrato do serviço de usuários
 */
export interface IUserService {
  create(createData: ICreateUserData): Promise<IUser>;
  findAll(filters: IUserFilters): Promise<IPaginatedUsers>;
  findOne(id: string): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  update(id: string, updateData: IUpdateUserData): Promise<IUser>;
  remove(id: string): Promise<void>;
  verifyEmail(userId: string): Promise<IUser>;
  changePassword(userId: string, newPassword: string): Promise<void>;
}

/**
 * Interface para contrato de validação de usuários
 */
export interface IUserValidationService {
  validateUniqueEmail(email: string, excludeUserId?: string): Promise<void>;
  validatePasswordStrength(password: string): boolean;
  validateUserCanLogin(user: IUser): void;
}

/**
 * Interface para contrato de busca de usuários
 */
export interface IUserSearchService {
  search(filters: IUserFilters): Promise<IPaginatedUsers>;
  searchByEmail(email: string): Promise<IUser[]>;
  searchByName(name: string): Promise<IUser[]>;
}
