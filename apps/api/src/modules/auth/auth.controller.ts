import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Roles, Role, AuthenticatedRequest, Public } from '@nexus/auth';
import { RolesGuard } from './guards/roles.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
  UserPayloadDto,
  MessageResponseDto,
} from './dto';

/**
 * Auth Controller
 *
 * Endpoints de autenticação e autorização:
 * - Register (apenas ADMIN)
 * - Login/Logout
 * - Refresh tokens
 * - Change password
 * - Forgot/Reset password
 * - User profile
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registra novo usuário (apenas ADMIN)
   *
   * Endpoint protegido - apenas usuários com role ADMIN podem criar novos usuários
   */
  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar novo usuário',
    description:
      'Cria um novo usuário no sistema. Apenas administradores podem realizar esta operação.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiConflictResponse({
    description: 'Email já está em uso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão de ADMIN',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login de usuário
   *
   * Endpoint público - não requer autenticação
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login de usuário',
    description: 'Autentica um usuário e retorna tokens JWT (access e refresh)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas ou usuário inativo',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Logout de usuário
   *
   * Invalida o token atual
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout de usuário',
    description: 'Invalida o token JWT atual, fazendo logout do usuário',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout realizado com sucesso',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async logout(@Request() req: AuthenticatedRequest): Promise<MessageResponseDto> {
    // Extrai token do header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') ?? '';

    return this.authService.logout(token, req.user.id);
  }

  /**
   * Renovar tokens
   *
   * Gera novos access e refresh tokens usando refresh token válido
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar tokens',
    description: 'Gera novos tokens JWT usando um refresh token válido',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens renovados com sucesso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Refresh token inválido ou ausente',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido, expirado ou revogado',
  })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refresh_token);
  }

  /**
   * Trocar senha
   *
   * Permite que o usuário autenticado troque sua senha
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trocar senha',
    description: 'Permite que o usuário autenticado altere sua senha fornecendo a senha atual',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha alterada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Senha atual incorreta ou nova senha inválida',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  /**
   * Solicitar recuperação de senha
   *
   * Envia email com link para resetar senha
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Envia um email com link para recuperação de senha. Sempre retorna sucesso para não expor emails existentes.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Se o email existir, um link de recuperação será enviado',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email inválido',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Resetar senha com token
   *
   * Redefine a senha usando token de recuperação
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resetar senha',
    description: 'Redefine a senha do usuário usando token de recuperação recebido por email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha resetada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Token inválido, expirado ou nova senha inválida',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * Obter perfil do usuário autenticado
   *
   * Retorna dados do usuário atual
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter perfil do usuário',
    description: 'Retorna os dados do usuário autenticado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do usuário',
    type: UserPayloadDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<UserPayloadDto> {
    return this.authService.getUserProfile(req.user.id);
  }
}
