import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
  UserPayloadDto,
  MessageResponseDto,
} from './dto';
import { JwtPayload } from '@nexus/auth';

/**
 * Extended JWT Payload com tipo de token
 */
interface ExtendedJwtPayload extends JwtPayload {
  type?: string;
}

/**
 * Auth Service
 *
 * Serviço principal de autenticação do sistema:
 * - Registro de usuários (apenas por ADMIN)
 * - Login e logout
 * - Refresh de tokens
 * - Troca e recuperação de senha
 * - Validação de usuários
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Registra novo usuário no sistema
   *
   * Apenas usuários ADMIN podem criar novos usuários
   *
   * @param registerDto - Dados do novo usuário
   * @returns Dados do usuário criado com tokens
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, first_name, last_name, phone, user_type } = registerDto;

    // Verifica se email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Valida força da senha
    const isPasswordStrong = this.passwordService.validatePasswordStrength(password);
    if (!isPasswordStrong) {
      throw new BadRequestException(
        'Senha fraca. Deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial',
      );
    }

    // Hash da senha
    const password_hash = await this.passwordService.hashPassword(password);

    // Cria usuário
    const userData: Partial<User> = {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      user_type,
      status: UserStatus.ACTIVE,
      email_verified: false,
    };

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`Novo usuário registrado: ${savedUser.email} (${savedUser.id})`);

    // Gera tokens
    return this.generateAuthResponse(savedUser);
  }

  /**
   * Autentica usuário no sistema
   *
   * @param loginDto - Credenciais de login
   * @returns Tokens de autenticação e dados do usuário
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Busca usuário com roles
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica senha
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica status do usuário
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inativo ou bloqueado');
    }

    // Atualiza último login
    user.last_login_at = new Date();
    await this.userRepository.save(user);

    this.logger.log(`Usuário autenticado: ${user.email} (${user.id})`);

    // Gera tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Faz logout do usuário, invalidando o token
   *
   * @param token - Access token a ser invalidado
   * @param userId - ID do usuário fazendo logout
   */
  async logout(token: string, userId: string): Promise<MessageResponseDto> {
    // Adiciona token à blacklist
    await this.tokenBlacklistService.addToBlacklist(token);

    this.logger.log(`Usuário desconectado: ${userId}`);

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  /**
   * Renova access token usando refresh token
   *
   * @param refreshToken - Refresh token válido
   * @returns Novos tokens de autenticação
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Valida refresh token
      const decoded = (await this.tokenService.validateToken(refreshToken)) as ExtendedJwtPayload;

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      // Verifica se está na blacklist
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token inválido ou revogado');
      }

      // Busca usuário
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        relations: ['roles'],
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Usuário inativo ou bloqueado');
      }

      // Adiciona refresh token antigo à blacklist
      await this.tokenBlacklistService.addToBlacklist(refreshToken);

      this.logger.log(`Tokens renovados para usuário: ${user.id}`);

      // Gera novos tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Erro ao renovar tokens: ${errorMessage}`);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  /**
   * Troca senha do usuário
   *
   * @param userId - ID do usuário
   * @param changePasswordDto - Senhas atual e nova
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    const { current_password, new_password } = changePasswordDto;

    // Busca usuário
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verifica senha atual
    const isPasswordValid = await this.passwordService.comparePassword(
      current_password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Verifica se nova senha é diferente
    if (current_password === new_password) {
      throw new BadRequestException('Nova senha deve ser diferente da atual');
    }

    // Valida força da nova senha
    const isPasswordStrong = this.passwordService.validatePasswordStrength(new_password);
    if (!isPasswordStrong) {
      throw new BadRequestException(
        'Senha fraca. Deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial',
      );
    }

    // Hash da nova senha
    user.password_hash = await this.passwordService.hashPassword(new_password);
    await this.userRepository.save(user);

    this.logger.log(`Senha alterada para usuário: ${user.id}`);

    return {
      message: 'Senha alterada com sucesso',
    };
  }

  /**
   * Solicita recuperação de senha
   *
   * Envia email com token de recuperação
   *
   * @param forgotPasswordDto - Email do usuário
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Sempre retorna sucesso para não expor emails existentes
    if (!user) {
      this.logger.warn(`Tentativa de recuperação de senha para email inexistente: ${email}`);
      return {
        message: 'Se o email existir, um link de recuperação será enviado',
      };
    }

    // Gera token de recuperação
    const resetToken = this.tokenService.generateResetToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hora

    // Salva token e expiração no usuário
    user.reset_password_token = resetToken;
    user.reset_password_expires = resetTokenExpires;
    await this.userRepository.save(user);

    // TODO: Enviar email com link de recuperação contendo o resetToken

    this.logger.log(`Token de recuperação gerado para: ${user.email}`);

    return {
      message: 'Se o email existir, um link de recuperação será enviado',
    };
  }

  /**
   * Reseta senha usando token de recuperação
   *
   * @param resetPasswordDto - Token e nova senha
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    const { token, new_password } = resetPasswordDto;

    // Busca usuário pelo token
    const user = await this.userRepository.findOne({
      where: {
        reset_password_token: token,
      },
    });

    // Valida token e expiração
    if (!user?.reset_password_expires || user.reset_password_expires < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Valida força da senha
    const isPasswordStrong = this.passwordService.validatePasswordStrength(new_password);
    if (!isPasswordStrong) {
      throw new BadRequestException(
        'Senha fraca. Deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial',
      );
    }

    // Atualiza senha e limpa token
    user.password_hash = await this.passwordService.hashPassword(new_password);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await this.userRepository.save(user);

    this.logger.log(`Senha resetada com sucesso para: ${user.email}`);

    return {
      message: 'Senha alterada com sucesso',
    };
  }

  /**
   * Valida usuário por JWT payload
   *
   * Usado pela JwtStrategy do Passport
   *
   * @param payload - Payload do JWT
   * @returns Usuário se válido
   */
  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['roles'],
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return user;
  }

  /**
   * Busca usuário por ID
   *
   * @param userId - ID do usuário
   * @returns Dados do usuário
   */
  async getUserProfile(userId: string): Promise<UserPayloadDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.mapUserToPayload(user);
  }

  /**
   * Gera resposta de autenticação com tokens
   *
   * @param user - Usuário autenticado
   * @returns Resposta com tokens e dados do usuário
   */
  private generateAuthResponse(user: User): AuthResponseDto {
    const roles = user.roles?.map(role => role.name) || [];

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      roles,
    };

    const { access_token, refresh_token } = this.tokenService.generateTokens(payload);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: this.tokenService.getAccessTokenExpiresIn(),
      user: this.mapUserToPayload(user),
    };
  }

  /**
   * Mapeia entidade User para UserPayloadDto
   *
   * @param user - Entidade User
   * @returns UserPayloadDto
   */
  private mapUserToPayload(user: User): UserPayloadDto {
    return {
      id: user.id,
      email: user.email,
      full_name: `${user.first_name} ${user.last_name}`,
      user_type: user.user_type,
      roles: user.roles?.map(role => role.name) || [],
    };
  }
}
