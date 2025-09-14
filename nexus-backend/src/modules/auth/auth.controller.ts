import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Rate limiting
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário',
    description: 'Autentica um usuário com email e senha, retornando tokens JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas de login',
  })
  async login(@Body() loginDto: LoginDto, @Req() request: Request): Promise<LoginResponseDto> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent');

    return this.authService.login(loginDto, ipAddress, userAgent);
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description: 'Renova o access token usando um refresh token válido',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido',
  })
  async refreshToken(
    @Body('refresh_token') refreshToken: string,
  ): Promise<{ access_token: string }> {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout do usuário',
    description: 'Invalida o token JWT do usuário (logout)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  async logout(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    // Extrai o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { message: 'Token não fornecido, logout local realizado' };
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('User-Agent');

    // Adiciona o token à blacklist
    const success = await this.tokenBlacklistService.addToBlacklist(token);

    // Log auditoria do logout
    if (req.user) {
      await this.authService.logLogout(req.user.id, req.user.email, ipAddress, userAgent);
    }

    if (success) {
      return { message: 'Logout realizado com sucesso' };
    }

    return { message: 'Logout parcial - token pode ainda estar válido' };
  }

  @Post('validate-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar força da senha',
    description: 'Valida se uma senha atende aos critérios de segurança',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação da senha',
  })
  validatePassword(@Body('password') password: string): { valid: boolean; message?: string } {
    const isValid = this.authService.validatePassword(password);

    return {
      valid: isValid,
      message: isValid
        ? 'Senha válida'
        : 'Senha deve conter ao menos: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial',
    };
  }

  /**
   * Extrai o IP real do cliente considerando proxies
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      (request.headers['x-real-ip'] as string) ??
      request.socket.remoteAddress ??
      'unknown'
    );
  }
}
