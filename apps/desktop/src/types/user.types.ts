/**
 * User Types
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: "admin" | "driver" | "customer" | "operator" | "manager";
  status: "active" | "inactive" | "suspended";
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: User["user_type"];
  status?: User["status"];
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type?: User["user_type"];
  status?: User["status"];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  user_type?: User["user_type"];
  status?: User["status"];
}
