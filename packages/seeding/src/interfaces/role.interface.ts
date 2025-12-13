export interface RoleEntity {
  id?: string;
  name: string;
  display_name?: string;
  description?: string;
  permissions?: string[];
  hierarchy_level?: number;
  is_active?: boolean;
}
