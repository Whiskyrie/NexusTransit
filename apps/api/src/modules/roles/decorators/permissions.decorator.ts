import { applyDecorators, SetMetadata } from '@nestjs/common';

/**
 * Chave para metadados de permissões
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Chave para metadados de modo de verificação (AND/OR)
 */
export const PERMISSION_MODE_KEY = 'permission_mode';

/**
 * Modo de verificação de permissões
 */
export enum PermissionMode {
  /**
   * Usuário deve ter TODAS as permissões especificadas
   */
  AND = 'AND',
  /**
   * Usuário deve ter PELO MENOS UMA das permissões especificadas
   */
  OR = 'OR',
}

/**
 * Tipo de retorno para decorators compostos
 */
type ComposedDecorator = ReturnType<typeof applyDecorators>;

/**
 * Decorator para especificar permissões requeridas em um endpoint
 *
 * @param permissions - Lista de permissões necessárias
 *
 * @example
 * ```typescript
 * @Permissions('users.read', 'users.write')
 * @Get()
 * findAll() {
 *   // Usuário precisa ter ambas permissões
 * }
 * ```
 *
 * @example
 * ```typescript
 * @Permissions('users.*')
 * @Get()
 * findAll() {
 *   // Suporta wildcard - usuário precisa ter qualquer permissão de users
 * }
 * ```
 */
export const Permissions = (...permissions: string[]): ComposedDecorator => {
  return applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions));
};

/**
 * Decorator alternativo que permite especificar modo explicitamente
 *
 * @param permissions - Lista de permissões necessárias
 * @param mode - Modo de verificação: AND ou OR
 *
 * @example
 * ```typescript
 * @RequirePermissions(['users.read', 'users.write'], PermissionMode.OR)
 * @Get()
 * findAll() {
 *   // Usuário precisa ter pelo menos uma permissão
 * }
 * ```
 */
export const RequirePermissions = (
  permissions: string[],
  mode: PermissionMode = PermissionMode.AND,
): ComposedDecorator => {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSION_MODE_KEY, mode),
  );
};

/**
 * Decorator que requer pelo menos uma das permissões especificadas
 *
 * @param permissions - Lista de permissões (usuário precisa ter pelo menos uma)
 *
 * @example
 * ```typescript
 * @RequireAnyPermission('users.read', 'users.write', 'users.admin')
 * @Get()
 * findAll() {
 *   // Usuário precisa ter pelo menos uma dessas permissões
 * }
 * ```
 */
export const RequireAnyPermission = (...permissions: string[]): ComposedDecorator => {
  return RequirePermissions(permissions, PermissionMode.OR);
};

/**
 * Decorator que requer todas as permissões especificadas
 *
 * @param permissions - Lista de permissões (usuário precisa ter todas)
 *
 * @example
 * ```typescript
 * @RequireAllPermissions('users.read', 'users.write')
 * @Get()
 * findAll() {
 *   // Usuário precisa ter ambas as permissões
 * }
 * ```
 */
export const RequireAllPermissions = (...permissions: string[]): ComposedDecorator => {
  return RequirePermissions(permissions, PermissionMode.AND);
};

/**
 * Decorator para marcar que o endpoint é público (não requer permissões)
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * health() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = (): ComposedDecorator => {
  return applyDecorators(SetMetadata('isPublic', true));
};
