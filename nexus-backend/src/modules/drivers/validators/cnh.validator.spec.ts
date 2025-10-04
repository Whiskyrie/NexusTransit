import { IsCNHConstraint, normalizeCNH } from './cnh.validator';

describe('IsCNHConstraint', () => {
  let constraint: IsCNHConstraint;

  beforeEach(() => {
    constraint = new IsCNHConstraint();
  });

  describe('validate', () => {
    it('should return true for valid CNHs', () => {
      const validCnhs = [
        '52798802310', // 527988023 + dígitos 10
        '12345678900', // 123456789 + dígitos 00
        '11144477753', // 111444777 + dígitos 53
        '98765432109', // 987654321 + dígitos 09
      ];

      validCnhs.forEach(cnh => {
        expect(constraint.validate(cnh)).toBe(true);
      });
    });

    it('should return false for invalid CNHs', () => {
      const invalidCnhs: string[] = [
        '12345678901', // Wrong check digits (should be 00)
        '11111111111', // All same digits
        '1234567890', // 10 digits
        '123456789012', // 12 digits
        '1234567890a', // Contains letter
        '', // Empty
      ];

      invalidCnhs.forEach(cnh => {
        expect(constraint.validate(cnh)).toBe(false);
      });
    });

    it('should return false for non-string input', () => {
      expect(constraint.validate(null as unknown as string)).toBe(false);
      expect(constraint.validate(undefined as unknown as string)).toBe(false);
      expect(constraint.validate(12345678900 as unknown as string)).toBe(false);
    });

    it('should handle formatted CNHs correctly', () => {
      // Test formatted valid CNHs (with spaces or dots - should be cleaned and validated)
      expect(constraint.validate('527.988.023.10')).toBe(true);
      expect(constraint.validate('123 456 789 00')).toBe(true);
    });

    it('should reject CNHs with invalid check digits', () => {
      const invalidCheckDigitCnhs = [
        '12345678901', // Wrong check digits (should be 00)
        '12345678910', // Wrong check digits (should be 00)
        '98765432100', // Wrong check digits (should be 09)
      ];

      invalidCheckDigitCnhs.forEach(cnh => {
        expect(constraint.validate(cnh)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(constraint.validate('00000000000')).toBe(false); // All zeros
      expect(constraint.validate('99999999999')).toBe(false); // All nines
      expect(constraint.validate('12345678900')).toBe(true); // Valid (123456789 + 00)
      expect(constraint.validate('11144477753')).toBe(true); // Valid (111444777 + 53)
    });
  });

  describe('defaultMessage', () => {
    it('should return correct error message', () => {
      expect(constraint.defaultMessage()).toBe('CNH deve estar em formato válido');
    });
  });
});

describe('normalizeCNH', () => {
  it('should remove formatting from CNH', () => {
    expect(normalizeCNH('12345678900')).toBe('12345678900');
    expect(normalizeCNH('12345678901')).toBe('12345678901');
    expect(normalizeCNH('12345678910')).toBe('12345678910');
    expect(normalizeCNH('')).toBe('');
    expect(normalizeCNH(null as unknown as string)).toBe('');
    expect(normalizeCNH(undefined as unknown as string)).toBe('');
  });
});
