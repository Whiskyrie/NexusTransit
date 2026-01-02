import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOperator } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Validador assíncrono customizado para email único
 *
 * Verifica no banco de dados se o email já está em uso por outro usuário
 *
 * @Injectable - Permite injeção de dependências
 */
@ValidatorConstraint({ name: 'isUniqueEmail', async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Valida se email é único no sistema
   *
   * @param email - Email a ser validado
   * @param args - Argumentos de validação (pode conter userId para exclusão)
   * @returns True se email é único
   */
  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    if (!email) {
      return false;
    }

    // Normalizar email
    const normalizedEmail = email.trim().toLowerCase();

    // Buscar usuário com este email
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      withDeleted: false, // Não considerar usuários deletados
    });

    // Se não encontrou, email é único
    if (!existingUser) {
      return true;
    }

    // Se encontrou, verificar se é o mesmo usuário (para updates)
    // O userId pode ser passado via constraints do decorator
    const objectWithId = args.object as { id?: string };
    const userId = objectWithId.id;
    if (userId && existingUser.id === userId) {
      return true;
    }

    return false;
  }

  /**
   * Mensagem de erro padrão
   */
  defaultMessage(args: ValidationArguments): string {
    return `Email '${args.value}' já está em uso`;
  }
}

/**
 * Decorator para validação de email único
 *
 * Verifica assincronamente se o email já está cadastrado no sistema
 *
 * IMPORTANTE: Este validator requer que IsUniqueEmailConstraint esteja
 * registrado nos providers do módulo
 *
 * @param validationOptions - Opções adicionais de validação
 *
 * @example
 * ! Uso em DTO de criação
 * class CreateUserDto {
 *   @IsUniqueEmail()
 *   @IsEmail()
 *   email: string;
 * }
 *
 * @example
 * ! Uso com mensagem customizada
 * class RegisterDto {
 *   @IsUniqueEmail({
 *     message: 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.'
 *   })
 *   @IsEmail()
 *   email: string;
 * }
 */
export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsUniqueEmailConstraint,
    });
  };
}

/**
 * Função auxiliar para verificar se email é único (sem usar decorator)
 *
 * Útil para validações programáticas fora de DTOs
 *
 * @param userRepository - Repositório de usuários
 * @param email - Email a ser verificado
 * @param excludeUserId - ID do usuário a ser excluído da verificação (opcional)
 * @returns True se email é único
 *
 * @example
 * const isUnique = await checkEmailUniqueness(
 *   userRepository,
 *   'novo@email.com'
 * );
 *
 * if (!isUnique) {
 *   throw new ConflictException('Email já existe');
 * }
 */
export async function checkEmailUniqueness(
  userRepository: Repository<User>,
  email: string,
  excludeUserId?: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  const where: { email: string; id?: FindOperator<string> } = {
    email: normalizedEmail,
  };

  if (excludeUserId) {
    where.id = Not(excludeUserId);
  }

  const existingUser = await userRepository.findOne({
    where,
    withDeleted: false,
  });

  return !existingUser;
}
