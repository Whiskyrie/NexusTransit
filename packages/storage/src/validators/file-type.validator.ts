import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { StorageConfig } from "../config/storage.config";

/**
 * Validador customizado para tipos de arquivo
 *
 * Implementa validação de MIME types e extensões permitidas
 */
@ValidatorConstraint({ name: "isValidFileType", async: false })
export class IsValidFileTypeConstraint implements ValidatorConstraintInterface {
  validate(value: Express.Multer.File, args: ValidationArguments): boolean {
    if (!value || !value.mimetype || !value.originalname) {
      return false;
    }

    const storageConfig = args.object as { storageConfig: StorageConfig };
    const allowedMimeTypes = storageConfig.storageConfig?.upload?.allowedMimeTypes || [];
    const allowedExtensions = storageConfig.storageConfig?.upload?.allowedExtensions || [];

    // Validar MIME type
    const isValidMimeType = allowedMimeTypes.includes(value.mimetype);

    // Validar extensão
    const fileExtension = this.getFileExtension(value.originalname);
    const isValidExtension = allowedExtensions.includes(fileExtension);

    return isValidMimeType && isValidExtension;
  }

  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : "";
  }

  defaultMessage(args: ValidationArguments): string {
    const storageConfig = args.object as { storageConfig: StorageConfig };
    const allowedTypes = storageConfig.storageConfig?.upload?.allowedMimeTypes.join(", ") || "";
    return `Invalid file type. Allowed types: ${allowedTypes}`;
  }
}

/**
 * Decorator para validação de tipo de arquivo
 *
 * @example
 * ```typescript
 * class UploadFileDto {
 *   @IsValidFileType()
 *   file: Express.Multer.File;
 * }
 * ```
 */
export function IsValidFileType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidFileTypeConstraint,
    });
  };
}

/**
 * Função auxiliar para normalizar extensão de arquivo
 */
export function normalizeFileExtension(value: string): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

/**
 * Função auxiliar para validar extensão de arquivo
 */
export function isValidFileExtension(extension: string, allowedExtensions: string[]): boolean {
  const normalized = normalizeFileExtension(extension);
  return allowedExtensions.includes(normalized);
}
