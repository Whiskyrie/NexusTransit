import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Interface para validação de certificado MOPP
 */
export interface MOPPCertificate {
  certificate_number: string;
  issue_date: Date;
  expiration_date: Date;
  issuing_authority: string;
  categories: string[];
}

/**
 * Validator customizado para certificado MOPP
 * (Movimentação e Operação de Produtos Perigosos)
 */
@ValidatorConstraint({ name: 'IsMOPPValid', async: false })
export class IsMOPPValidConstraint implements ValidatorConstraintInterface {
  validate(certificate: MOPPCertificate): boolean {
    if (!certificate) {
      return false;
    }

    // Valida estrutura básica
    if (!this.hasRequiredFields(certificate)) {
      return false;
    }

    // Valida número do certificado
    if (!this.isValidCertificateNumber(certificate.certificate_number)) {
      return false;
    }

    // Valida datas
    if (!this.isValidDates(certificate.issue_date, certificate.expiration_date)) {
      return false;
    }

    // Valida categorias
    if (!this.hasValidCategories(certificate.categories)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Certificado MOPP inválido. Verifique os campos obrigatórios e formato.';
  }

  /**
   * Verifica se todos os campos obrigatórios estão presentes
   */
  private hasRequiredFields(certificate: MOPPCertificate): boolean {
    return !!(
      certificate.certificate_number &&
      certificate.issue_date &&
      certificate.expiration_date &&
      certificate.issuing_authority &&
      certificate.categories &&
      Array.isArray(certificate.categories)
    );
  }

  /**
   * Valida o formato do número do certificado MOPP
   * Formato esperado: MOPP-XXXX-YYYY (onde X e Y são dígitos)
   */
  private isValidCertificateNumber(number: string): boolean {
    const moppPattern = /^MOPP-\d{4}-\d{4}$/;
    return moppPattern.test(number);
  }

  /**
   * Valida se as datas são válidas e a emissão é anterior ao vencimento
   */
  private isValidDates(issueDate: Date, expirationDate: Date): boolean {
    const issue = new Date(issueDate);
    const expiration = new Date(expirationDate);

    if (isNaN(issue.getTime()) || isNaN(expiration.getTime())) {
      return false;
    }

    return issue < expiration;
  }

  /**
   * Valida se as categorias são válidas
   */
  private hasValidCategories(categories: string[]): boolean {
    if (!categories || categories.length === 0) {
      return false;
    }

    const validCategories = [
      'CLASSE_1', // Explosivos
      'CLASSE_2', // Gases
      'CLASSE_3', // Líquidos inflamáveis
      'CLASSE_4', // Sólidos inflamáveis
      'CLASSE_5', // Substâncias oxidantes e peróxidos orgânicos
      'CLASSE_6', // Substâncias tóxicas e infectantes
      'CLASSE_7', // Material radioativo
      'CLASSE_8', // Substâncias corrosivas
      'CLASSE_9', // Substâncias perigosas diversas
    ];

    return categories.every(cat => validCategories.includes(cat));
  }
}

/**
 * Decorador para validar certificado MOPP
 *
 * @param validationOptions - Opções de validação
 *
 * @example
 * ```typescript
 * class DriverDocumentDto {
 *   @IsMOPPValid()
 *   mopp_certificate: MOPPCertificate;
 * }
 * ```
 */
export function IsMOPPValid(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsMOPPValidConstraint,
    });
  };
}

/**
 * Função auxiliar para verificar se o certificado MOPP está vencido
 *
 * @param expirationDate - Data de vencimento do certificado
 * @returns true se o certificado está vencido
 */
export function isMOPPExpired(expirationDate: Date): boolean {
  const now = new Date();
  const expiration = new Date(expirationDate);
  return expiration < now;
}

/**
 * Função auxiliar para calcular dias até o vencimento do MOPP
 *
 * @param expirationDate - Data de vencimento
 * @returns Número de dias até o vencimento (negativo se já vencido)
 */
export function daysUntilMOPPExpiration(expirationDate: Date): number {
  const now = new Date();
  const expiration = new Date(expirationDate);
  const diffTime = expiration.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
