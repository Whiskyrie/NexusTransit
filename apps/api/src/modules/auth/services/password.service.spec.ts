import { Test, type TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PasswordService', () => {
  let service: PasswordService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('hashPassword', () => {
    it('deve fazer hash da senha usando bcrypt', async () => {
      const password = 'Test@123456';
      const hashedPassword = '$2b$12$hashed';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('deve usar 12 rounds de salt', async () => {
      const password = 'Test@123456';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await service.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePassword', () => {
    it('deve retornar true para senha correta', async () => {
      const password = 'Test@123456';
      const hash = '$2b$12$hashed';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('deve retornar false para senha incorreta', async () => {
      const password = 'WrongPassword';
      const hash = '$2b$12$hashed';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });

  describe('validatePasswordStrength', () => {
    it('deve aceitar senha forte válida', () => {
      const strongPassword = 'Test@123456';

      const result = service.validatePasswordStrength(strongPassword);

      expect(result).toBe(true);
    });

    it('deve rejeitar senha sem maiúscula', () => {
      const password = 'test@123456';

      const result = service.validatePasswordStrength(password);

      expect(result).toBe(false);
    });

    it('deve rejeitar senha sem minúscula', () => {
      const password = 'TEST@123456';

      const result = service.validatePasswordStrength(password);

      expect(result).toBe(false);
    });

    it('deve rejeitar senha sem número', () => {
      const password = 'Test@Test';

      const result = service.validatePasswordStrength(password);

      expect(result).toBe(false);
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const password = 'Test123456';

      const result = service.validatePasswordStrength(password);

      expect(result).toBe(false);
    });

    it('deve rejeitar senha com menos de 8 caracteres', () => {
      const password = 'Te@123';

      const result = service.validatePasswordStrength(password);

      expect(result).toBe(false);
    });

    it('deve aceitar senha com todos os requisitos', () => {
      const password = 'MyP@ssw0rd123!';

      const result = service.validatePasswordStrength(password);

      expect(result).toBe(true);
    });

    it('deve aceitar senha com caracteres especiais variados', () => {
      const passwords = [
        'Test@123456',
        'Test$123456',
        'Test!123456',
        'Test%123456',
        'Test*123456',
        'Test?123456',
        'Test&123456',
        'Test#123456',
      ];

      passwords.forEach(password => {
        expect(service.validatePasswordStrength(password)).toBe(true);
      });
    });
  });

  describe('generateRandomPassword', () => {
    it('deve gerar senha com tamanho padrão de 16 caracteres', () => {
      const password = service.generateRandomPassword();

      expect(password).toHaveLength(16);
    });

    it('deve gerar senha com tamanho especificado', () => {
      const length = 20;
      const password = service.generateRandomPassword(length);

      expect(password).toHaveLength(length);
    });

    it('deve gerar senha com pelo menos uma maiúscula', () => {
      const password = service.generateRandomPassword();

      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('deve gerar senha com pelo menos uma minúscula', () => {
      const password = service.generateRandomPassword();

      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('deve gerar senha com pelo menos um número', () => {
      const password = service.generateRandomPassword();

      expect(/\d/.test(password)).toBe(true);
    });

    it('deve gerar senha com pelo menos um caractere especial', () => {
      const password = service.generateRandomPassword();

      expect(/[@$!%*?&#]/.test(password)).toBe(true);
    });

    it('deve gerar senhas diferentes a cada chamada', () => {
      const password1 = service.generateRandomPassword();
      const password2 = service.generateRandomPassword();
      const password3 = service.generateRandomPassword();

      expect(password1).not.toBe(password2);
      expect(password1).not.toBe(password3);
      expect(password2).not.toBe(password3);
    });

    it('deve gerar senha que passa na validação de força', () => {
      const password = service.generateRandomPassword();

      expect(service.validatePasswordStrength(password)).toBe(true);
    });

    it('deve gerar senha com tamanho mínimo de 8 caracteres', () => {
      const password = service.generateRandomPassword(8);

      expect(password).toHaveLength(8);
      expect(service.validatePasswordStrength(password)).toBe(true);
    });
  });
});
