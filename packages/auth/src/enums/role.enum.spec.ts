import {
  Role,
  RoleHierarchy,
  RoleDescriptions,
  SYSTEM_ROLES,
  DEFAULT_ROLES,
  ROLE_HIERARCHY_LEVEL,
  hasRoleAccess,
  getAllRoles,
  isValidRole,
  isSystemRole,
  getRoleHierarchyLevel,
  hasHigherOrEqualHierarchy,
} from "./role.enum";

describe("Role Enum", () => {
  it("deve ter todos os roles definidos", () => {
    expect(Role.SUPER_ADMIN).toBe("super_admin");
    expect(Role.ADMIN).toBe("admin");
    expect(Role.MANAGER).toBe("manager");
    expect(Role.GESTOR).toBe("gestor");
    expect(Role.OPERATOR).toBe("operator");
    expect(Role.DESPACHANTE).toBe("despachante");
    expect(Role.MOTORISTA).toBe("motorista");
    expect(Role.DRIVER).toBe("driver");
    expect(Role.CLIENTE).toBe("cliente");
    expect(Role.CUSTOMER).toBe("customer");
  });

  it("deve ter valores únicos para cada role", () => {
    const values = Object.values(Role);
    const uniqueValues = new Set(values);

    expect(values.length).toBe(uniqueValues.size);
  });

  describe("RoleHierarchy", () => {
    it("deve ter hierarquia definida para todos os roles", () => {
      const roles = Object.values(Role);

      roles.forEach((role) => {
        expect(RoleHierarchy).toHaveProperty(role);
        expect(Array.isArray(RoleHierarchy[role])).toBe(true);
      });
    });

    it("SUPER_ADMIN deve ter acesso a todos os outros roles", () => {
      const superAdminRoles = RoleHierarchy[Role.SUPER_ADMIN];

      expect(superAdminRoles).toContain(Role.ADMIN);
      expect(superAdminRoles).toContain(Role.MANAGER);
      expect(superAdminRoles).toContain(Role.GESTOR);
      expect(superAdminRoles).toContain(Role.OPERATOR);
      expect(superAdminRoles).toContain(Role.DESPACHANTE);
      expect(superAdminRoles).toContain(Role.MOTORISTA);
      expect(superAdminRoles).toContain(Role.DRIVER);
      expect(superAdminRoles).toContain(Role.CLIENTE);
      expect(superAdminRoles).toContain(Role.CUSTOMER);
    });

    it("ADMIN deve ter acesso a roles de nível inferior", () => {
      const adminRoles = RoleHierarchy[Role.ADMIN];

      expect(adminRoles).toContain(Role.MANAGER);
      expect(adminRoles).toContain(Role.GESTOR);
      expect(adminRoles).toContain(Role.OPERATOR);
      expect(adminRoles).toContain(Role.DESPACHANTE);
      expect(adminRoles).toContain(Role.MOTORISTA);
      expect(adminRoles).toContain(Role.DRIVER);
      expect(adminRoles).toContain(Role.CLIENTE);
      expect(adminRoles).toContain(Role.CUSTOMER);

      // ADMIN não deve ter acesso a SUPER_ADMIN
      expect(adminRoles).not.toContain(Role.SUPER_ADMIN);
    });

    it("MANAGER deve ter acesso limitado", () => {
      const managerRoles = RoleHierarchy[Role.MANAGER];

      expect(managerRoles).toContain(Role.GESTOR);
      expect(managerRoles).toContain(Role.OPERATOR);
      expect(managerRoles).toContain(Role.DESPACHANTE);
      expect(managerRoles).toContain(Role.MOTORISTA);
      expect(managerRoles).toContain(Role.DRIVER);

      // MANAGER não deve ter acesso a roles superiores
      expect(managerRoles).not.toContain(Role.SUPER_ADMIN);
      expect(managerRoles).not.toContain(Role.ADMIN);
    });

    it("GESTOR deve ter acesso específico", () => {
      const gestorRoles = RoleHierarchy[Role.GESTOR];

      expect(gestorRoles).toContain(Role.DESPACHANTE);
      expect(gestorRoles).toContain(Role.MOTORISTA);
      expect(gestorRoles).toContain(Role.DRIVER);

      expect(gestorRoles).not.toContain(Role.ADMIN);
      expect(gestorRoles).not.toContain(Role.MANAGER);
    });

    it("OPERATOR deve ter acesso a roles operacionais", () => {
      const operatorRoles = RoleHierarchy[Role.OPERATOR];

      expect(operatorRoles).toContain(Role.DESPACHANTE);
      expect(operatorRoles).toContain(Role.MOTORISTA);
      expect(operatorRoles).toContain(Role.DRIVER);

      expect(operatorRoles).not.toContain(Role.ADMIN);
    });

    it("DESPACHANTE deve ter acesso limitado a motoristas", () => {
      const despachanteRoles = RoleHierarchy[Role.DESPACHANTE];

      expect(despachanteRoles).toContain(Role.MOTORISTA);
      expect(despachanteRoles).toContain(Role.DRIVER);

      expect(despachanteRoles).not.toContain(Role.ADMIN);
      expect(despachanteRoles).not.toContain(Role.GESTOR);
    });

    it("MOTORISTA não deve ter acesso a outros roles", () => {
      const motoristaRoles = RoleHierarchy[Role.MOTORISTA];

      expect(motoristaRoles).toEqual([]);
    });

    it("DRIVER não deve ter acesso a outros roles", () => {
      const driverRoles = RoleHierarchy[Role.DRIVER];

      expect(driverRoles).toEqual([]);
    });

    it("CLIENTE não deve ter acesso a outros roles", () => {
      const clienteRoles = RoleHierarchy[Role.CLIENTE];

      expect(clienteRoles).toEqual([]);
    });

    it("CUSTOMER não deve ter acesso a outros roles", () => {
      const customerRoles = RoleHierarchy[Role.CUSTOMER];

      expect(customerRoles).toEqual([]);
    });

    it("não deve haver referências circulares na hierarquia", () => {
      Object.entries(RoleHierarchy).forEach(([role, subordinates]) => {
        subordinates.forEach((subordinate) => {
          expect(RoleHierarchy[subordinate]).not.toContain(role as Role);
        });
      });
    });

    it("deve respeitar hierarquia transitiva", () => {
      // Se ADMIN tem acesso a MANAGER e MANAGER tem acesso a GESTOR,
      // então ADMIN deve ter acesso direto a GESTOR também
      const adminRoles = RoleHierarchy[Role.ADMIN];
      const managerRoles = RoleHierarchy[Role.MANAGER];

      managerRoles.forEach((managerSubordinate) => {
        if (managerSubordinate !== Role.ADMIN) {
          expect(adminRoles).toContain(managerSubordinate);
        }
      });
    });
  });

  describe("hasRoleAccess", () => {
    it("deve retornar true quando roles são iguais", () => {
      expect(hasRoleAccess(Role.ADMIN, Role.ADMIN)).toBe(true);
      expect(hasRoleAccess(Role.DRIVER, Role.DRIVER)).toBe(true);
    });

    it("deve retornar true quando userRole tem acesso a requiredRole", () => {
      expect(hasRoleAccess(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
      expect(hasRoleAccess(Role.ADMIN, Role.MANAGER)).toBe(true);
      expect(hasRoleAccess(Role.MANAGER, Role.DRIVER)).toBe(true);
    });

    it("deve retornar false quando userRole não tem acesso a requiredRole", () => {
      expect(hasRoleAccess(Role.DRIVER, Role.ADMIN)).toBe(false);
      expect(hasRoleAccess(Role.CUSTOMER, Role.OPERATOR)).toBe(false);
      expect(hasRoleAccess(Role.OPERATOR, Role.SUPER_ADMIN)).toBe(false);
    });
  });

  describe("getAllRoles", () => {
    it("deve retornar todas as roles como array", () => {
      const roles = getAllRoles();

      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBe(10);
    });

    it("deve incluir todas as roles esperadas", () => {
      const roles = getAllRoles();

      expect(roles).toContain(Role.SUPER_ADMIN);
      expect(roles).toContain(Role.ADMIN);
      expect(roles).toContain(Role.MANAGER);
      expect(roles).toContain(Role.GESTOR);
      expect(roles).toContain(Role.OPERATOR);
      expect(roles).toContain(Role.DESPACHANTE);
      expect(roles).toContain(Role.MOTORISTA);
      expect(roles).toContain(Role.DRIVER);
      expect(roles).toContain(Role.CLIENTE);
      expect(roles).toContain(Role.CUSTOMER);
    });
  });

  describe("isValidRole", () => {
    it("deve retornar true para roles válidas", () => {
      expect(isValidRole("admin")).toBe(true);
      expect(isValidRole("super_admin")).toBe(true);
      expect(isValidRole("driver")).toBe(true);
      expect(isValidRole("customer")).toBe(true);
    });

    it("deve retornar false para roles inválidas", () => {
      expect(isValidRole("invalid")).toBe(false);
      expect(isValidRole("")).toBe(false);
      expect(isValidRole("ADMIN")).toBe(false);
      expect(isValidRole("user")).toBe(false);
    });
  });

  describe("RoleDescriptions", () => {
    it("deve ter descrições para todas as roles", () => {
      const roles = Object.values(Role);

      roles.forEach((role) => {
        expect(RoleDescriptions[role]).toBeDefined();
        expect(typeof RoleDescriptions[role]).toBe("string");
        expect(RoleDescriptions[role].length).toBeGreaterThan(0);
      });
    });
  });

  describe("SYSTEM_ROLES", () => {
    it("deve incluir SUPER_ADMIN e ADMIN", () => {
      expect(SYSTEM_ROLES).toContain(Role.SUPER_ADMIN);
      expect(SYSTEM_ROLES).toContain(Role.ADMIN);
    });

    it("deve ter exatamente 2 roles", () => {
      expect(SYSTEM_ROLES.length).toBe(2);
    });
  });

  describe("DEFAULT_ROLES", () => {
    it("deve incluir as roles padrão do sistema", () => {
      expect(DEFAULT_ROLES).toContain(Role.SUPER_ADMIN);
      expect(DEFAULT_ROLES).toContain(Role.ADMIN);
      expect(DEFAULT_ROLES).toContain(Role.MANAGER);
      expect(DEFAULT_ROLES).toContain(Role.OPERATOR);
      expect(DEFAULT_ROLES).toContain(Role.DRIVER);
      expect(DEFAULT_ROLES).toContain(Role.CUSTOMER);
    });
  });

  describe("isSystemRole", () => {
    it("deve retornar true para SUPER_ADMIN e ADMIN", () => {
      expect(isSystemRole(Role.SUPER_ADMIN)).toBe(true);
      expect(isSystemRole(Role.ADMIN)).toBe(true);
    });

    it("deve retornar false para outras roles", () => {
      expect(isSystemRole(Role.MANAGER)).toBe(false);
      expect(isSystemRole(Role.DRIVER)).toBe(false);
      expect(isSystemRole(Role.CUSTOMER)).toBe(false);
    });
  });

  describe("ROLE_HIERARCHY_LEVEL", () => {
    it("deve ter níveis definidos para todas as roles", () => {
      const roles = Object.values(Role);

      roles.forEach((role) => {
        expect(ROLE_HIERARCHY_LEVEL[role]).toBeDefined();
        expect(typeof ROLE_HIERARCHY_LEVEL[role]).toBe("number");
      });
    });

    it("SUPER_ADMIN deve ter o nível mais alto (0)", () => {
      expect(ROLE_HIERARCHY_LEVEL[Role.SUPER_ADMIN]).toBe(0);
    });

    it("roles equivalentes devem ter o mesmo nível", () => {
      expect(ROLE_HIERARCHY_LEVEL[Role.DRIVER]).toBe(ROLE_HIERARCHY_LEVEL[Role.MOTORISTA]);
      expect(ROLE_HIERARCHY_LEVEL[Role.CUSTOMER]).toBe(ROLE_HIERARCHY_LEVEL[Role.CLIENTE]);
      expect(ROLE_HIERARCHY_LEVEL[Role.MANAGER]).toBe(ROLE_HIERARCHY_LEVEL[Role.GESTOR]);
    });
  });

  describe("getRoleHierarchyLevel", () => {
    it("deve retornar o nível correto para cada role", () => {
      expect(getRoleHierarchyLevel(Role.SUPER_ADMIN)).toBe(0);
      expect(getRoleHierarchyLevel(Role.ADMIN)).toBe(1);
      expect(getRoleHierarchyLevel(Role.MANAGER)).toBe(2);
      expect(getRoleHierarchyLevel(Role.DRIVER)).toBe(4);
    });

    it("deve retornar 999 para role inválida", () => {
      expect(getRoleHierarchyLevel("invalid" as Role)).toBe(999);
    });
  });

  describe("hasHigherOrEqualHierarchy", () => {
    it("deve retornar true quando role1 tem hierarquia maior ou igual", () => {
      expect(hasHigherOrEqualHierarchy(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
      expect(hasHigherOrEqualHierarchy(Role.ADMIN, Role.MANAGER)).toBe(true);
      expect(hasHigherOrEqualHierarchy(Role.DRIVER, Role.DRIVER)).toBe(true);
    });

    it("deve retornar false quando role1 tem hierarquia menor", () => {
      expect(hasHigherOrEqualHierarchy(Role.DRIVER, Role.ADMIN)).toBe(false);
      expect(hasHigherOrEqualHierarchy(Role.CUSTOMER, Role.OPERATOR)).toBe(false);
    });
  });

  describe("validação de strings", () => {
    it("deve permitir verificar se uma string é um role válido", () => {
      const validRole = "admin";
      const invalidRole = "invalid_role";

      expect(Object.values(Role)).toContain(validRole);
      expect(Object.values(Role)).not.toContain(invalidRole);
    });

    it("deve ser case-sensitive", () => {
      expect(Role.ADMIN).toBe("admin");
      expect(Role.ADMIN).not.toBe("ADMIN");
      expect(Role.ADMIN).not.toBe("Admin");
    });
  });
});
