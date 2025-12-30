/**
 * Constantes de Permissões do Sistema
 *
 * Define todas as permissões disponíveis no sistema NexusTransit
 * organizadas por recurso e ação.
 */

/**
 * Permissões por Recurso
 */
export const PERMISSIONS = {
  USERS: {
    READ: 'users:read',
    WRITE: 'users:write',
    DELETE: 'users:delete',
  },
  VEHICLES: {
    READ: 'vehicles:read',
    WRITE: 'vehicles:write',
    DELETE: 'vehicles:delete',
  },
  DRIVERS: {
    READ: 'drivers:read',
    WRITE: 'drivers:write',
    DELETE: 'drivers:delete',
  },
  ROUTES: {
    READ: 'routes:read',
    WRITE: 'routes:write',
    DELETE: 'routes:delete',
  },
  DELIVERIES: {
    READ: 'deliveries:read',
    WRITE: 'deliveries:write',
    DELETE: 'deliveries:delete',
  },
  INCIDENTS: {
    READ: 'incidents:read',
    WRITE: 'incidents:write',
    DELETE: 'incidents:delete',
  },
  REPORTS: {
    READ: 'reports:read',
    GENERATE: 'reports:generate',
  },
  AUDIT: {
    READ: 'audit:read',
  },
  SETTINGS: {
    READ: 'settings:read',
    WRITE: 'settings:write',
  },
  ROLES: {
    READ: 'roles:read',
    WRITE: 'roles:write',
    DELETE: 'roles:delete',
    ASSIGN: 'roles:assign',
  },
  CUSTOMERS: {
    READ: 'customers:read',
    WRITE: 'customers:write',
    DELETE: 'customers:delete',
  },
  SERVICE_ORDERS: {
    READ: 'service-orders:read',
    WRITE: 'service-orders:write',
    DELETE: 'service-orders:delete',
  },
  TRACKING: {
    READ: 'tracking:read',
    WRITE: 'tracking:write',
  },
  ADDRESS: {
    READ: 'address:read',
    WRITE: 'address:write',
  },
};

/**
 * Todas as permissões disponíveis (array plano)
 */
export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flatMap(resourcePermissions =>
  Object.values(resourcePermissions),
);

/**
 * Permissões por ação (agrupadas)
 */
export const PERMISSIONS_BY_ACTION: Record<string, string[]> = {
  READ: [
    PERMISSIONS.USERS.READ,
    PERMISSIONS.VEHICLES.READ,
    PERMISSIONS.DRIVERS.READ,
    PERMISSIONS.ROUTES.READ,
    PERMISSIONS.DELIVERIES.READ,
    PERMISSIONS.INCIDENTS.READ,
    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.AUDIT.READ,
    PERMISSIONS.SETTINGS.READ,
    PERMISSIONS.ROLES.READ,
    PERMISSIONS.CUSTOMERS.READ,
    PERMISSIONS.SERVICE_ORDERS.READ,
    PERMISSIONS.TRACKING.READ,
    PERMISSIONS.ADDRESS.READ,
  ],
  WRITE: [
    PERMISSIONS.USERS.WRITE,
    PERMISSIONS.VEHICLES.WRITE,
    PERMISSIONS.DRIVERS.WRITE,
    PERMISSIONS.ROUTES.WRITE,
    PERMISSIONS.DELIVERIES.WRITE,
    PERMISSIONS.INCIDENTS.WRITE,
    PERMISSIONS.SETTINGS.WRITE,
    PERMISSIONS.ROLES.WRITE,
    PERMISSIONS.CUSTOMERS.WRITE,
    PERMISSIONS.SERVICE_ORDERS.WRITE,
    PERMISSIONS.TRACKING.WRITE,
    PERMISSIONS.ADDRESS.WRITE,
  ],
  DELETE: [
    PERMISSIONS.USERS.DELETE,
    PERMISSIONS.VEHICLES.DELETE,
    PERMISSIONS.DRIVERS.DELETE,
    PERMISSIONS.ROUTES.DELETE,
    PERMISSIONS.DELIVERIES.DELETE,
    PERMISSIONS.INCIDENTS.DELETE,
    PERMISSIONS.ROLES.DELETE,
    PERMISSIONS.CUSTOMERS.DELETE,
    PERMISSIONS.SERVICE_ORDERS.DELETE,
  ],
  GENERATE: [PERMISSIONS.REPORTS.GENERATE],
  ASSIGN: [PERMISSIONS.ROLES.ASSIGN],
} as const;

/**
 * Permissões por recurso (agrupadas)
 */
export const PERMISSIONS_BY_RESOURCE: Record<string, string[]> = {
  users: [PERMISSIONS.USERS.READ, PERMISSIONS.USERS.WRITE, PERMISSIONS.USERS.DELETE],
  vehicles: [PERMISSIONS.VEHICLES.READ, PERMISSIONS.VEHICLES.WRITE, PERMISSIONS.VEHICLES.DELETE],
  drivers: [PERMISSIONS.DRIVERS.READ, PERMISSIONS.DRIVERS.WRITE, PERMISSIONS.DRIVERS.DELETE],
  routes: [PERMISSIONS.ROUTES.READ, PERMISSIONS.ROUTES.WRITE, PERMISSIONS.ROUTES.DELETE],
  deliveries: [
    PERMISSIONS.DELIVERIES.READ,
    PERMISSIONS.DELIVERIES.WRITE,
    PERMISSIONS.DELIVERIES.DELETE,
  ],
  incidents: [
    PERMISSIONS.INCIDENTS.READ,
    PERMISSIONS.INCIDENTS.WRITE,
    PERMISSIONS.INCIDENTS.DELETE,
  ],
  reports: [PERMISSIONS.REPORTS.READ, PERMISSIONS.REPORTS.GENERATE],
  audit: [PERMISSIONS.AUDIT.READ],
  settings: [PERMISSIONS.SETTINGS.READ, PERMISSIONS.SETTINGS.WRITE],
  roles: [
    PERMISSIONS.ROLES.READ,
    PERMISSIONS.ROLES.WRITE,
    PERMISSIONS.ROLES.DELETE,
    PERMISSIONS.ROLES.ASSIGN,
  ],
  customers: [
    PERMISSIONS.CUSTOMERS.READ,
    PERMISSIONS.CUSTOMERS.WRITE,
    PERMISSIONS.CUSTOMERS.DELETE,
  ],
  'service-orders': [
    PERMISSIONS.SERVICE_ORDERS.READ,
    PERMISSIONS.SERVICE_ORDERS.WRITE,
    PERMISSIONS.SERVICE_ORDERS.DELETE,
  ],
  tracking: [PERMISSIONS.TRACKING.READ, PERMISSIONS.TRACKING.WRITE],
  address: [PERMISSIONS.ADDRESS.READ, PERMISSIONS.ADDRESS.WRITE],
};

/**
 * Verifica se uma permissão é válida
 */
export function isValidPermission(permission: string): boolean {
  return ALL_PERMISSIONS.includes(permission);
}

/**
 * Obtém todas as permissões de um recurso
 */
export function getResourcePermissions(resource: string): string[] {
  return PERMISSIONS_BY_RESOURCE[resource] || [];
}

/**
 * Verifica se uma permissão pertence a um recurso
 */
export function isResourcePermission(permission: string, resource: string): boolean {
  return permission.startsWith(`${resource}:`);
}

/**
 * Obtém o recurso de uma permissão
 */
export function getPermissionResource(permission: string): string | null {
  const match = /^([^:]+):/.exec(permission);
  return match ? match[1] : null;
}

/**
 * Obtém a ação de uma permissão
 */
export function getPermissionAction(permission: string): string | null {
  const match = /:([^:]+)$/.exec(permission);
  return match ? match[1] : null;
}
