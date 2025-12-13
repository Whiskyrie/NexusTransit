import { RoleEntity } from "./role.interface";

export interface UserEntity {
  id?: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type?: string;
  status?: string;
  email_verified?: boolean;
  roles?: RoleEntity[];
}
