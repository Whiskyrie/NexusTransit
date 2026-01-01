import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { USER_ERROR_MESSAGES } from '../constants/user.constants';

/**
 * Exceção lançada quando usuário não é encontrado
 */
export class UserNotFoundException extends NotFoundException {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Usuário com identificador '${identifier}' não encontrado`
        : USER_ERROR_MESSAGES.NOT_FOUND,
    );
  }
}

/**
 * Exceção lançada quando email já existe no sistema
 */
export class UserAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`Usuário com email '${email}' já existe`);
  }
}

/**
 * Exceção lançada quando credenciais são inválidas
 */
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super(USER_ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
}

/**
 * Exceção lançada quando usuário está bloqueado
 */
export class UserBlockedException extends ForbiddenException {
  constructor(reason?: string) {
    super(reason ?? USER_ERROR_MESSAGES.BLOCKED);
  }
}

/**
 * Exceção lançada quando usuário está inativo
 */
export class UserInactiveException extends ForbiddenException {
  constructor() {
    super(USER_ERROR_MESSAGES.INACTIVE);
  }
}

/**
 * Exceção lançada quando email não foi verificado
 */
export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super(USER_ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
  }
}

/**
 * Exceção lançada quando senha não atende aos requisitos
 */
export class WeakPasswordException extends BadRequestException {
  constructor(message?: string) {
    super(message ?? USER_ERROR_MESSAGES.WEAK_PASSWORD);
  }
}

/**
 * Exceção lançada quando conta está temporariamente bloqueada
 */
export class AccountLockedException extends ForbiddenException {
  constructor(remainingMinutes?: number) {
    const message = remainingMinutes
      ? `${USER_ERROR_MESSAGES.ACCOUNT_LOCKED}. Tente novamente em ${remainingMinutes} minutos`
      : USER_ERROR_MESSAGES.ACCOUNT_LOCKED;
    super(message);
  }
}

/**
 * Exceção lançada quando token é inválido ou expirado
 */
export class InvalidTokenException extends BadRequestException {
  constructor() {
    super(USER_ERROR_MESSAGES.INVALID_TOKEN);
  }
}

/**
 * Exceção lançada quando token de reset de senha expirou
 */
export class PasswordResetExpiredException extends BadRequestException {
  constructor() {
    super(USER_ERROR_MESSAGES.PASSWORD_RESET_EXPIRED);
  }
}

/**
 * Exceção lançada quando nova senha é igual à atual
 */
export class SamePasswordException extends BadRequestException {
  constructor() {
    super(USER_ERROR_MESSAGES.SAME_PASSWORD);
  }
}
