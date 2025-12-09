import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Testes de Contrato - OpenAPI Validation
 * 
 * Valida que a especificação OpenAPI está correta e completa.
 * Este teste NÃO executa o serviço, apenas valida o arquivo openapi.yaml.
 */
describe('OpenAPI Contract Tests', () => {
  let openApiSpec: any;

  beforeAll(() => {
    // Carregar especificação OpenAPI
    const specPath = path.join(__dirname, '../../openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = yaml.load(specContent);
  });

  describe('Metadados da API', () => {
    it('deve ter informações básicas', () => {
      expect(openApiSpec.openapi).toBe('3.1.0');
      expect(openApiSpec.info).toBeDefined();
      expect(openApiSpec.info.title).toContain('Auth Service');
      expect(openApiSpec.info.version).toBeDefined();
    });

    it('deve ter servidores configurados', () => {
      expect(openApiSpec.servers).toBeDefined();
      expect(Array.isArray(openApiSpec.servers)).toBe(true);
      expect(openApiSpec.servers.length).toBeGreaterThan(0);
    });

    it('deve ter tags definidas', () => {
      expect(openApiSpec.tags).toBeDefined();
      expect(Array.isArray(openApiSpec.tags)).toBe(true);
      
      const tagNames = openApiSpec.tags.map((t: any) => t.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Users');
      expect(tagNames).toContain('Roles');
      expect(tagNames).toContain('Health');
    });
  });

  describe('Endpoints de Authentication', () => {
    it('POST /auth/login deve estar definido', () => {
      expect(openApiSpec.paths['/auth/login']).toBeDefined();
      expect(openApiSpec.paths['/auth/login'].post).toBeDefined();
      
      const operation = openApiSpec.paths['/auth/login'].post;
      expect(operation.operationId).toBe('login');
      expect(operation.requestBody).toBeDefined();
      expect(operation.responses['200']).toBeDefined();
      expect(operation.responses['401']).toBeDefined();
    });

    it('POST /auth/refresh deve estar definido', () => {
      expect(openApiSpec.paths['/auth/refresh']).toBeDefined();
      expect(openApiSpec.paths['/auth/refresh'].post).toBeDefined();
      
      const operation = openApiSpec.paths['/auth/refresh'].post;
      expect(operation.operationId).toBe('refreshToken');
      expect(operation.requestBody).toBeDefined();
      expect(operation.responses['200']).toBeDefined();
    });

    it('POST /auth/logout deve estar definido', () => {
      expect(openApiSpec.paths['/auth/logout']).toBeDefined();
      expect(openApiSpec.paths['/auth/logout'].post).toBeDefined();
      
      const operation = openApiSpec.paths['/auth/logout'].post;
      expect(operation.operationId).toBe('logout');
      expect(operation.security).toBeDefined();
      expect(operation.responses['204']).toBeDefined();
    });

    it('GET /auth/me deve estar definido', () => {
      expect(openApiSpec.paths['/auth/me']).toBeDefined();
      expect(openApiSpec.paths['/auth/me'].get).toBeDefined();
      
      const operation = openApiSpec.paths['/auth/me'].get;
      expect(operation.operationId).toBe('getProfile');
      expect(operation.security).toBeDefined();
      expect(operation.responses['200']).toBeDefined();
    });
  });

  describe('Endpoints de Users', () => {
    it('GET /users deve estar definido', () => {
      expect(openApiSpec.paths['/users']).toBeDefined();
      expect(openApiSpec.paths['/users'].get).toBeDefined();
      
      const operation = openApiSpec.paths['/users'].get;
      expect(operation.operationId).toBe('listUsers');
      expect(operation.security).toBeDefined();
    });

    it('POST /users deve estar definido', () => {
      expect(openApiSpec.paths['/users'].post).toBeDefined();
      
      const operation = openApiSpec.paths['/users'].post;
      expect(operation.operationId).toBe('createUser');
      expect(operation.requestBody).toBeDefined();
      expect(operation.responses['201']).toBeDefined();
    });

    it('GET /users/{id} deve estar definido', () => {
      expect(openApiSpec.paths['/users/{id}']).toBeDefined();
      expect(openApiSpec.paths['/users/{id}'].get).toBeDefined();
      
      const operation = openApiSpec.paths['/users/{id}'].get;
      expect(operation.parameters).toBeDefined();
      expect(operation.parameters.length).toBeGreaterThan(0);
    });

    it('PATCH /users/{id} deve estar definido', () => {
      expect(openApiSpec.paths['/users/{id}'].patch).toBeDefined();
      
      const operation = openApiSpec.paths['/users/{id}'].patch;
      expect(operation.operationId).toBe('updateUser');
    });

    it('DELETE /users/{id} deve estar definido', () => {
      expect(openApiSpec.paths['/users/{id}'].delete).toBeDefined();
      
      const operation = openApiSpec.paths['/users/{id}'].delete;
      expect(operation.operationId).toBe('deleteUser');
      expect(operation.responses['204']).toBeDefined();
    });
  });

  describe('Endpoints de Roles', () => {
    it('GET /roles deve estar definido', () => {
      expect(openApiSpec.paths['/roles']).toBeDefined();
      expect(openApiSpec.paths['/roles'].get).toBeDefined();
      
      const operation = openApiSpec.paths['/roles'].get;
      expect(operation.operationId).toBe('listRoles');
    });

    it('POST /roles deve estar definido', () => {
      expect(openApiSpec.paths['/roles'].post).toBeDefined();
      
      const operation = openApiSpec.paths['/roles'].post;
      expect(operation.operationId).toBe('createRole');
    });

    it('GET /roles/{id} deve estar definido', () => {
      expect(openApiSpec.paths['/roles/{id}']).toBeDefined();
      expect(openApiSpec.paths['/roles/{id}'].get).toBeDefined();
    });
  });

  describe('Endpoint de Health', () => {
    it('GET /health deve estar definido', () => {
      expect(openApiSpec.paths['/health']).toBeDefined();
      expect(openApiSpec.paths['/health'].get).toBeDefined();
      
      const operation = openApiSpec.paths['/health'].get;
      expect(operation.operationId).toBe('healthCheck');
      expect(operation.responses['200']).toBeDefined();
    });
  });

  describe('Schemas (DTOs)', () => {
    it('LoginDto schema deve existir', () => {
      expect(openApiSpec.components.schemas.LoginDto).toBeDefined();
      
      const schema = openApiSpec.components.schemas.LoginDto;
      expect(schema.required).toContain('email');
      expect(schema.required).toContain('password');
      expect(schema.properties.email).toBeDefined();
      expect(schema.properties.password).toBeDefined();
    });

    it('RefreshTokenDto schema deve existir', () => {
      expect(openApiSpec.components.schemas.RefreshTokenDto).toBeDefined();
      
      const schema = openApiSpec.components.schemas.RefreshTokenDto;
      expect(schema.required).toContain('refresh_token');
    });

    it('LoginResponse schema deve existir', () => {
      expect(openApiSpec.components.schemas.LoginResponse).toBeDefined();
      
      const schema = openApiSpec.components.schemas.LoginResponse;
      expect(schema.properties.access_token).toBeDefined();
      expect(schema.properties.refresh_token).toBeDefined();
      expect(schema.properties.user).toBeDefined();
    });

    it('CreateUserDto schema deve existir', () => {
      expect(openApiSpec.components.schemas.CreateUserDto).toBeDefined();
      
      const schema = openApiSpec.components.schemas.CreateUserDto;
      expect(schema.required).toContain('name');
      expect(schema.required).toContain('email');
      expect(schema.required).toContain('password');
    });

    it('UpdateUserDto schema deve existir', () => {
      expect(openApiSpec.components.schemas.UpdateUserDto).toBeDefined();
    });

    it('UserResponse schema deve existir', () => {
      expect(openApiSpec.components.schemas.UserResponse).toBeDefined();
      
      const schema = openApiSpec.components.schemas.UserResponse;
      expect(schema.properties.id).toBeDefined();
      expect(schema.properties.email).toBeDefined();
      expect(schema.properties.name).toBeDefined();
    });

    it('CreateRoleDto schema deve existir', () => {
      expect(openApiSpec.components.schemas.CreateRoleDto).toBeDefined();
    });

    it('RoleResponse schema deve existir', () => {
      expect(openApiSpec.components.schemas.RoleResponse).toBeDefined();
    });

    it('ErrorResponse schema deve existir', () => {
      expect(openApiSpec.components.schemas.ErrorResponse).toBeDefined();
      
      const schema = openApiSpec.components.schemas.ErrorResponse;
      expect(schema.properties.statusCode).toBeDefined();
      expect(schema.properties.message).toBeDefined();
      expect(schema.properties.error).toBeDefined();
    });
  });

  describe('Security Schemes', () => {
    it('bearerAuth deve estar definido', () => {
      expect(openApiSpec.components.securitySchemes).toBeDefined();
      expect(openApiSpec.components.securitySchemes.bearerAuth).toBeDefined();
      
      const scheme = openApiSpec.components.securitySchemes.bearerAuth;
      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('bearer');
      expect(scheme.bearerFormat).toBe('JWT');
    });
  });

  describe('Validação de Estrutura', () => {
    it('todos endpoints devem ter operationId único', () => {
      const operationIds = new Set<string>();
      
      Object.keys(openApiSpec.paths).forEach(pathKey => {
        const path = openApiSpec.paths[pathKey];
        Object.keys(path).forEach(method => {
          if (method !== 'parameters') {
            const operation = path[method];
            if (operation.operationId) {
              expect(operationIds.has(operation.operationId)).toBe(false);
              operationIds.add(operation.operationId);
            }
          }
        });
      });
    });

    it('todos endpoints protegidos devem ter security definido', () => {
      const publicEndpoints = ['/auth/login', '/auth/refresh', '/health'];
      
      Object.keys(openApiSpec.paths).forEach(pathKey => {
        if (!publicEndpoints.includes(pathKey)) {
          const path = openApiSpec.paths[pathKey];
          Object.keys(path).forEach(method => {
            if (method !== 'parameters' && method === 'get' || method === 'post' || method === 'patch' || method === 'delete') {
              const operation = path[method];
              // Endpoints não-públicos devem ter security (exceto login e refresh)
              if (pathKey !== '/auth/login' && pathKey !== '/auth/refresh') {
                expect(operation.security).toBeDefined();
              }
            }
          });
        }
      });
    });
  });
});
