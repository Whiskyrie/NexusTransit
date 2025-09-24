import { IsCPFConstraint, IsCPF, normalizeCPF } from './cpf.validator';

describe('IsCPFConstraint', () => {
  let constraint: IsCPFConstraint;

  beforeEach(() => {
    constraint = new IsCPFConstraint();
  });

  describe('validate', () => {
    it('should return true for valid CPF', () => {
      expect(constraint.validate('12345678909')).toBe(true);
      expect(constraint.validate('98765432100')).toBe(true);
      expect(constraint.validate('11144477735')).toBe(true);
    });

    it('should return false for CPF with wrong length', () => {
      expect(constraint.validate('123456789')).toBe(false);
      expect(constraint.validate('123456789012')).toBe(false);
    });

    it('should return false for CPF with all same digits', () => {
      expect(constraint.validate('11111111111')).toBe(false);
      expect(constraint.validate('22222222222')).toBe(false);
    });

    it('should return false for CPF with invalid check digits', () => {
      expect(constraint.validate('12345678901')).toBe(false);
      expect(constraint.validate('98765432199')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(constraint.validate('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      // Test with number type - cast to unknown first to avoid direct any usage
      expect(constraint.validate(123 as unknown as string)).toBe(false);
      // Test with object type
      expect(constraint.validate({} as unknown as string)).toBe(false);
      // Test with null and undefined
      expect(constraint.validate(null as unknown as string)).toBe(false);
      expect(constraint.validate(undefined as unknown as string)).toBe(false);
    });

    it('should handle formatted CPF correctly', () => {
      // Valid formatted CPFs should be accepted
      expect(constraint.validate('111.444.777-35')).toBe(true);
      expect(constraint.validate('123.456.789-09')).toBe(true);
      // Invalid formatted CPFs should be rejected
      expect(constraint.validate('123.456.789-00')).toBe(false); // Wrong check digits
      expect(constraint.validate('987.654.321-99')).toBe(false); // Wrong check digits
    });
  });

  describe('defaultMessage', () => {
    it('should return correct error message', () => {
      constraint = new IsCPFConstraint();
      expect(constraint.defaultMessage()).toBe('CPF deve estar em formato válido');
    });
  });
});

describe('IsCPF decorator', () => {
  it('should create validator constraint', () => {
    class TestClass {
      @IsCPF()
      cpf!: string;
    }

    const testInstance = new TestClass();
    expect(testInstance).toBeDefined();
  });

  it('should validate CPF property', () => {
    class TestClass {
      @IsCPF()
      cpf!: string;
    }

    const validInstance = new TestClass();
    validInstance.cpf = '12345678909';

    const invalidInstance = new TestClass();
    invalidInstance.cpf = '123456789';

    // Test validation results (validators don't throw, they return boolean)
    const validator = new IsCPFConstraint();
    expect(validator.validate(validInstance.cpf)).toBe(true);
    expect(validator.validate(invalidInstance.cpf)).toBe(false);
  });
});

describe('normalizeCPF', () => {
  it('should remove non-digit characters', () => {
    expect(normalizeCPF('123.456.789-09')).toBe('12345678909');
    expect(normalizeCPF('123 456 789 09')).toBe('12345678909');
    expect(normalizeCPF('123abc456def789ghi09')).toBe('12345678909');
  });

  it('should handle empty string', () => {
    expect(normalizeCPF('')).toBe('');
  });

  it('should handle null and undefined values', () => {
    expect(normalizeCPF(null as unknown as string)).toBe('');
    expect(normalizeCPF(undefined as unknown as string)).toBe('');
  });

  it('should handle numeric strings correctly', () => {
    expect(normalizeCPF('123')).toBe('123');
    expect(normalizeCPF('only-numbers-123')).toBe('123');
  });
});
