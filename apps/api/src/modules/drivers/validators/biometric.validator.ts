import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Interface para dados biométricos
 */
export interface BiometricData {
  photo_url: string;
  photo_quality?: number;
  face_encoding?: string;
  capture_date: Date;
  device_info?: string;
}

/**
 * Validator customizado para foto/biometria de motorista
 */
@ValidatorConstraint({ name: 'IsBiometricValid', async: false })
export class IsBiometricValidConstraint implements ValidatorConstraintInterface {
  validate(biometric: BiometricData): boolean {
    if (!biometric) {
      return false;
    }

    // Valida campos obrigatórios
    if (!this.hasRequiredFields(biometric)) {
      return false;
    }

    // Valida URL da foto
    if (!this.isValidPhotoUrl(biometric.photo_url)) {
      return false;
    }

    // Valida qualidade da foto (se fornecida)
    if (biometric.photo_quality !== undefined && !this.isValidQuality(biometric.photo_quality)) {
      return false;
    }

    // Valida encoding facial (se fornecido)
    if (biometric.face_encoding && !this.isValidFaceEncoding(biometric.face_encoding)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Dados biométricos inválidos. Verifique a foto e qualidade.';
  }

  /**
   * Verifica se todos os campos obrigatórios estão presentes
   */
  private hasRequiredFields(biometric: BiometricData): boolean {
    return !!(biometric.photo_url && biometric.capture_date);
  }

  /**
   * Valida se a URL da foto é válida
   */
  private isValidPhotoUrl(url: string): boolean {
    try {
      const validUrl = new URL(url);
      // Verifica se é uma URL válida e se aponta para uma imagem
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      return validExtensions.some(ext => validUrl.pathname.toLowerCase().endsWith(ext));
    } catch {
      return false;
    }
  }

  /**
   * Valida a qualidade da foto (0-100)
   */
  private isValidQuality(quality: number): boolean {
    return quality >= 0 && quality <= 100;
  }

  /**
   * Valida o encoding facial (base64)
   */
  private isValidFaceEncoding(encoding: string): boolean {
    // Verifica se é uma string base64 válida
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    return base64Pattern.test(encoding) && encoding.length > 0;
  }
}

/**
 * Decorador para validar dados biométricos
 *
 * @param validationOptions - Opções de validação
 *
 * @example
 * ```typescript
 * class DriverDto {
 *   @IsBiometricValid()
 *   biometric_data: BiometricData;
 * }
 * ```
 */
export function IsBiometricValid(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsBiometricValidConstraint,
    });
  };
}

/**
 * Verifica se a qualidade da foto atende ao mínimo requerido
 *
 * @param quality - Qualidade da foto (0-100)
 * @param minQuality - Qualidade mínima aceitável (padrão: 70)
 * @returns true se a qualidade é aceitável
 */
export function isPhotoQualityAcceptable(quality: number, minQuality = 70): boolean {
  return quality >= minQuality;
}

/**
 * Verifica se a foto foi capturada recentemente
 *
 * @param captureDate - Data de captura da foto
 * @param maxDaysOld - Máximo de dias de idade aceitável (padrão: 180)
 * @returns true se a foto é recente
 */
export function isPhotoRecent(captureDate: Date, maxDaysOld = 180): boolean {
  const now = new Date();
  const capture = new Date(captureDate);
  const diffTime = now.getTime() - capture.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= maxDaysOld;
}

/**
 * Valida se há face encoding para reconhecimento facial
 *
 * @param biometric - Dados biométricos
 * @returns true se há encoding válido
 */
export function hasFaceEncoding(biometric: BiometricData): boolean {
  return !!(biometric.face_encoding && biometric.face_encoding.length > 0);
}

/**
 * Calcula score de qualidade biométrica
 *
 * @param biometric - Dados biométricos
 * @returns Score de 0-100
 */
export function calculateBiometricScore(biometric: BiometricData): number {
  let score = 0;

  // Qualidade da foto (peso: 40%)
  if (biometric.photo_quality) {
    score += (biometric.photo_quality / 100) * 40;
  }

  // Presença de face encoding (peso: 30%)
  if (hasFaceEncoding(biometric)) {
    score += 30;
  }

  // Recência da foto (peso: 20%)
  if (isPhotoRecent(biometric.capture_date, 90)) {
    score += 20;
  } else if (isPhotoRecent(biometric.capture_date, 180)) {
    score += 10;
  }

  // Informações do dispositivo (peso: 10%)
  if (biometric.device_info) {
    score += 10;
  }

  return Math.round(score);
}
