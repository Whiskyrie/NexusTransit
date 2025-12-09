# Changelog - @nexus/auth

## [1.0.0] - 2025-01-XX

### ✨ Adicionado
- **Decoradores**:
  - `@Public()` - Marca endpoints como públicos (sem autenticação)
  - `@Roles(...roles)` - Define roles necessários para acesso ao endpoint
  - `@CurrentUser()` - Extrai usuário autenticado da requisição

- **Guards**:
  - `JwtAuthGuard` - Guarda de autenticação JWT com suporte a @Public()
  - `RolesGuard` - Guarda de controle de acesso baseado em roles

- **Enums**:
  - `Role` - Enum com roles do sistema (ADMIN, GESTOR, DESPACHANTE, MOTORISTA, CLIENTE)
  - `RoleHierarchy` - Mapeamento de hierarquia de permissões

- **Interfaces**:
  - `JwtPayload` - Interface do payload JWT
  - `AuthUser<T>` - Interface genérica de usuário autenticado
  - `AuthenticatedRequest<T>` - Extensão do Request do Express com usuário

- **Utilitários**:
  - `hasRoleAccess()` - Verifica se role tem acesso baseado em hierarquia
  - `getAllRoles()` - Retorna array com todos os roles
  - `isValidRole()` - Valida se string é um role válido

### 🔧 Configuração
- Package configurado como workspace package com peer dependencies do NestJS 11.x
- TypeScript configurado com strict mode
- Barrel exports para facilitar importação

### 📦 Integração
- ✅ Integrado em `apps/api`
- ✅ Imports atualizados em:
  - `auth.controller.ts`
  - `lgpd.controller.ts`
  - `rate-limit.controller.ts`
  - `common/guards/rate-limit.guard.ts`

### ✅ Validações
- ✅ Compilação bem-sucedida sem erros TypeScript
- ✅ Path mappings configurados em `apps/api/tsconfig.json`
- ✅ Todas as dependências de tipos instaladas (@types/express)
- ✅ Compatível com TypeScript strict mode e exactOptionalPropertyTypes

### 📝 Documentação
- README.md com exemplos de uso
- JSDoc completo em todos os exports públicos
- Exemplos de integração com NestJS

---

**Autor**: Sistema de Modularização NexusTransit  
**Revisão**: v1.0.0  
**Status**: ✅ PRODUCTION READY
