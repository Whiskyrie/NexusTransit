/**
 * Tipos relacionados à autenticação
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserPayload;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  roles?: string[];
  permissions?: string[];
}

export enum UserType {
  ADMIN = "ADMIN",
  DRIVER = "DRIVER",
  CUSTOMER = "CUSTOMER",
  OPERATOR = "OPERATOR",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}
