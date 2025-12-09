import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
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
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos (email mal formatado, senha ausente, etc)',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas, usuário inativo ou email não verificado',
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciais inválidas',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Muitas tentativas de login',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
      },
    },
  })
  async login(@Body() loginDto: LoginDto, @Req() request: Request): Promise<LoginResponseDto> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent');

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter dados do usuário autenticado',
    description: 'Retorna informações do usuário atualmente autenticado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do usuário retornados com sucesso',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Usuário não encontrado',
        error: 'Not Found',
      },
    },
  })
  async getProfile(@Req() request: AuthenticatedRequest): Promise<UserResponseDto> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent');

    return this.authService.getProfile(request.user.id, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description: 'Renova o access token usando um refresh token válido',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token renovado com sucesso',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Refresh token ausente ou mal formatado',
    schema: {
      example: {
        statusCode: 400,
        message: ['refresh_token should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido ou expirado',
    schema: {
      example: {
        statusCode: 401,
        message: 'Refresh token inválido',
        error: 'Unauthorized',
      },
    },
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<LoginResponseDto> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent');

    return this.authService.refreshToken(refreshTokenDto.refresh_token, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Realizar logout',
    description: 'Invalida o token JWT do usuário adicionando-o à blacklist',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout realizado com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async logout(@Req() req: AuthenticatedRequest): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return;
    }

    const token = authHeader.substring(7);
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('User-Agent');

    await this.tokenBlacklistService.addToBlacklist(token);

    if (req.user) {
      await this.authService.logLogout(req.user.id, req.user.email, ipAddress, userAgent);
    }
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
