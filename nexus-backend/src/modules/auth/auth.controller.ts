import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
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
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
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

    // Adiciona o token à blacklist
    const success = await this.tokenBlacklistService.addToBlacklist(token);

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
}
