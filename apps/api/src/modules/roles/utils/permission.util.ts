/**
 * Utilitários para manipulação e validação de permissões
 */

/**
 * Valida formato de uma string de permissão
 * Formato esperado: {resource}.{action} ou {resource}.*
 *
 * @param permission - String de permissão a validar
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidPermissionFormat('users.read') // true
 * isValidPermissionFormat('users.*') // true
 * isValidPermissionFormat('invalid') // false
 */
export function isValidPermissionFormat(permission: string): boolean {
  if (!permission || typeof permission !== 'string') {
    return false;
  }

  // Formato: resource.action ou resource.*
  const pattern = /^[a-z][a-z0-9_-]*(\.[a-z0-9_*-]+)+$/i;
  return pattern.test(permission);
}

/**
 * Parse uma string de permissão em resource e action
 *
 * @param permission - String de permissão
 * @returns Objeto com resource e action
 *
 * @example
 * parsePermission('users.read') // { resource: 'users', action: 'read' }
 * parsePermission('users.profile.update') // { resource: 'users.profile', action: 'update' }
 */
export function parsePermission(permission: string): {
  resource: string;
  action: string;
} | null {
  if (!isValidPermissionFormat(permission)) {
    return null;
  }

  const lastDotIndex = permission.lastIndexOf('.');
  const resource = permission.substring(0, lastDotIndex);
  const action = permission.substring(lastDotIndex + 1);

  return { resource, action };
}

/**
 * Expande wildcards em lista de permissões
 *
 * @param wildcardPermission - Permissão com wildcard (ex: users.*)
 * @param availablePermissions - Lista de todas permissões disponíveis
 * @returns Array de permissões expandidas
 *
 * @example
 * expandWildcard('users.*', ['users.read', 'users.write', 'roles.read'])
 * // ['users.read', 'users.write']
 */
export function expandWildcard(
  wildcardPermission: string,
  availablePermissions: string[],
): string[] {
  if (!wildcardPermission.includes('*')) {
    return [wildcardPermission];
  }

  const pattern = wildcardPermission.replace(/\./g, '\\.').replace(/\*/g, '.+');
  const regex = new RegExp(`^${pattern}$`);

  return availablePermissions.filter(perm => regex.test(perm));
}

/**
 * Remove permissões duplicadas de um array
 *
 * @param permissions - Array de permissões
 * @returns Array sem duplicatas
 */
export function deduplicatePermissions(permissions: string[]): string[] {
  return [...new Set(permissions)];
}

/**
 * Agrupa permissões por resource
 *
 * @param permissions - Array de permissões
 * @returns Objeto com resources como chaves e arrays de actions como valores
 *
 * @example
 * groupPermissionsByResource(['users.read', 'users.write', 'roles.read'])
 * // { users: ['read', 'write'], roles: ['read'] }
 */
export function groupPermissionsByResource(permissions: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const permission of permissions) {
    const parsed = parsePermission(permission);
    if (!parsed) {
      continue;
    }

    const { resource, action } = parsed;

    if (!grouped[resource]) {
      grouped[resource] = [];
    }

    grouped[resource].push(action);
  }

  return grouped;
}

/**
 * Verifica se uma lista de permissões contém outra (com suporte a wildcards)
 *
 * @param userPermissions - Permissões do usuário
 * @param requiredPermissions - Permissões requeridas
 * @returns true se todas as permissões requeridas estão cobertas
 *
 * @example
 * hasPermissions(['users.*'], ['users.read']) // true
 * hasPermissions(['users.read'], ['users.write']) // false
 */
export function hasPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(required => matchesAnyPermission(userPermissions, required));
}

/**
 * Verifica se alguma permissão do usuário corresponde à requerida
 *
 * @param userPermissions - Permissões do usuário
 * @param requiredPermission - Permissão requerida
 * @returns true se alguma permissão corresponde
 */
export function matchesAnyPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  // Match exato
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Match com wildcard do usuário
  for (const userPerm of userPermissions) {
    if (userPerm.includes('*')) {
      const pattern = userPerm.replace(/\./g, '\\.').replace(/\*/g, '.+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(requiredPermission)) {
        return true;
      }
    }
  }

  // Match com wildcard da permissão requerida
  if (requiredPermission.includes('*')) {
    const pattern = requiredPermission.replace(/\./g, '\\.').replace(/\*/g, '.+');
    const regex = new RegExp(`^${pattern}$`);
    return userPermissions.some(perm => regex.test(perm));
  }

  return false;
}

/**
 * Calcula a diferença entre dois conjuntos de permissões
 *
 * @param setA - Primeiro conjunto de permissões
 * @param setB - Segundo conjunto de permissões
 * @returns Permissões que estão em A mas não em B
 *
 * @example
 * diffPermissions(['users.read', 'users.write'], ['users.read'])
 * // ['users.write']
 */
export function diffPermissions(setA: string[], setB: string[]): string[] {
  const setBNormalized = new Set(setB);
  return setA.filter(perm => !setBNormalized.has(perm));
}

/**
 * Calcula a interseção entre dois conjuntos de permissões
 *
 * @param setA - Primeiro conjunto de permissões
 * @param setB - Segundo conjunto de permissões
 * @returns Permissões que estão em ambos os conjuntos
 */
export function intersectPermissions(setA: string[], setB: string[]): string[] {
  const setBNormalized = new Set(setB);
  return setA.filter(perm => setBNormalized.has(perm));
}

/**
 * Une dois conjuntos de permissões removendo duplicatas
 *
 * @param setA - Primeiro conjunto de permissões
 * @param setB - Segundo conjunto de permissões
 * @returns União dos conjuntos sem duplicatas
 */
export function unionPermissions(setA: string[], setB: string[]): string[] {
  return deduplicatePermissions([...setA, ...setB]);
}

/**
 * Valida se um array contém apenas permissões com formato válido
 *
 * @param permissions - Array de permissões
 * @returns true se todas permissões são válidas
 */
export function areAllPermissionsValid(permissions: string[]): boolean {
  return permissions.every(perm => isValidPermissionFormat(perm));
}

/**
 * Filtra permissões inválidas de um array
 *
 * @param permissions - Array de permissões
 * @returns Array apenas com permissões válidas
 */
export function filterValidPermissions(permissions: string[]): string[] {
  return permissions.filter(perm => isValidPermissionFormat(perm));
}

/**
 * Formata permissão para exibição amigável
 *
 * @param permission - Permissão no formato resource.action
 * @returns String formatada para exibição
 *
 * @example
 * formatPermissionDisplay('users.read') // 'Users: Read'
 * formatPermissionDisplay('service_orders.create') // 'Service Orders: Create'
 */
export function formatPermissionDisplay(permission: string): string {
  const parsed = parsePermission(permission);
  if (!parsed) {
    return permission;
  }

  const { resource, action } = parsed;

  // Capitalizar e substituir underscores/hífens por espaços
  const resourceFormatted = resource
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const actionFormatted = action.charAt(0).toUpperCase() + action.slice(1).replace(/[_-]/g, ' ');

  return `${resourceFormatted}: ${actionFormatted}`;
}

/**
 * Obtém o nível de especificidade de uma permissão
 * Quanto maior o número, mais específica a permissão
 *
 * @param permission - String de permissão
 * @returns Número indicando nível de especificidade
 *
 * @example
 * getPermissionSpecificity('*') // 0
 * getPermissionSpecificity('users.*') // 1
 * getPermissionSpecificity('users.read') // 2
 */
export function getPermissionSpecificity(permission: string): number {
  if (permission === '*') {
    return 0;
  }

  const parts = permission.split('.');
  const wildcardCount = parts.filter(p => p === '*').length;

  return parts.length - wildcardCount;
}

/**
 * Ordena permissões por especificidade (mais específicas primeiro)
 *
 * @param permissions - Array de permissões
 * @returns Array ordenado por especificidade
 */
export function sortBySpecificity(permissions: string[]): string[] {
  return [...permissions].sort((a, b) => getPermissionSpecificity(b) - getPermissionSpecificity(a));
}
