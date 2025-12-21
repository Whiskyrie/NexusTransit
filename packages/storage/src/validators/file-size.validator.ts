import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { StorageConfig } from "../config/storage.config";

/**
 * Validador customizado para tamanho de arquivo
 *
 * Implementa validação de tamanho máximo de arquivo
 */
@ValidatorConstraint({ name: "isValidFileSize", async: false })
export class IsValidFileSizeConstraint implements ValidatorConstraintInterface {
  validate(value: Express.Multer.File, args: ValidationArguments): boolean {
    if (!value || !value.size) {
      return false;
    }

    const storageConfig = args.object as { storageConfig: StorageConfig };
    const maxFileSize = storageConfig.storageConfig?.upload?.maxFileSize || 5 * 1024 * 1024; // 5MB default

    return value.size <= maxFileSize;
  }

  defaultMessage(args: ValidationArguments): string {
    const storageConfig = args.object as { storageConfig: StorageConfig };
    const maxSizeMB = storageConfig.storageConfig?.upload?.maxFileSize
      ? storageConfig.storageConfig.upload.maxFileSize / (1024 * 1024)
      : 5;
    return `File size too large. Maximum allowed: ${maxSizeMB}MB`;
  }
}

/**
 * Decorator para validação de tamanho de arquivo
 *
 * @example
 * ```typescript
 * class UploadFileDto {
 *   @IsValidFileSize()
 *   file: Express.Multer.File;
 * }
 * ```
 */
export function IsValidFileSize(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidFileSizeConstraint,
    });
  };
}

/**
 * Função auxiliar para converter bytes para MB
 */
export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Função auxiliar para converter MB para bytes
 */
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
}
