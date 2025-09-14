import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ConsentService } from './consent.service';
import { DataRequestService } from './data-request.service';
import { DataPortabilityService } from './data-portability.service';
import {
  CreateConsentDto,
  RevokeConsentDto,
  CreateDataRequestDto,
  UpdateDataRequestDto,
} from './dto';
import { DataRequestStatus, DataRequestType, ConsentType } from './enums';

interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('lgpd')
@UseGuards(JwtAuthGuard)
export class LgpdController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly dataRequestService: DataRequestService,
    private readonly dataPortabilityService: DataPortabilityService,
  ) {}

  @Post('consents')
  async createConsent(
    @Req() req: AuthenticatedRequest,
    @Body() createConsentDto: CreateConsentDto,
  ): Promise<{ success: boolean; message: string; data: unknown }> {
    const userId = req.user.id;

    // Adiciona informações de contexto
    if (req.ip) {
      createConsentDto.consentIp = req.ip;
    }
    const userAgent = req.get('User-Agent');
    if (userAgent) {
      createConsentDto.userAgent = userAgent;
    }
    createConsentDto.collectionMethod = 'web';

    const consent = await this.consentService.createConsent(userId, createConsentDto);

    return {
      success: true,
      message: 'Consentimento registrado com sucesso',
      data: consent,
    };
  }

  /**
   * Revoga um consentimento
   */
  @Put('consents/revoke')
  async revokeConsent(
    @Req() req: AuthenticatedRequest,
    @Body() revokeConsentDto: RevokeConsentDto,
  ): Promise<{ success: boolean; message: string; data: unknown }> {
    const userId = req.user.id;
    const consent = await this.consentService.revokeConsent(userId, revokeConsentDto);

    return {
      success: true,
      message: 'Consentimento revogado com sucesso',
      data: consent,
    };
  }

  /**
   * Obtém consentimentos do usuário
   */
  @Get('consents')
  async getUserConsents(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = req.user.id;
    const consents = await this.consentService.getUserConsents(userId);

    return {
      success: true,
      data: consents,
    };
  }

  /**
   * Obtém apenas consentimentos ativos do usuário
   */
  @Get('consents/active')
  async getActiveConsents(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = req.user.id;
    const consents = await this.consentService.getActiveUserConsents(userId);

    return {
      success: true,
      data: consents,
    };
  }

  /**
   * Verifica se usuário tem consentimento para um tipo específico
   */
  @Get('consents/check/:type')
  async checkConsent(
    @Req() req: AuthenticatedRequest,
    @Param('type') consentType: ConsentType,
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = req.user.id;
    const hasConsent = await this.consentService.hasValidConsent(userId, consentType);

    return {
      success: true,
      data: {
        consentType,
        hasValidConsent: hasConsent,
      },
    };
  }

  // === SOLICITAÇÕES DE DADOS ===

  /**
   * Cria uma nova solicitação de dados
   */
  @Post('data-requests')
  async createDataRequest(
    @Req() req: AuthenticatedRequest,
    @Body() createDataRequestDto: CreateDataRequestDto,
  ): Promise<{ success: boolean; message: string; data: unknown }> {
    const userId = req.user.id;

    // Adiciona informações de contexto
    if (req.ip) {
      createDataRequestDto.requestIp = req.ip;
    }
    const userAgent = req.get('User-Agent');
    if (userAgent) {
      createDataRequestDto.userAgent = userAgent;
    }

    const dataRequest = await this.dataRequestService.createDataRequest(
      userId,
      createDataRequestDto,
    );

    return {
      success: true,
      message: 'Solicitação criada com sucesso. Será processada em até 15 dias úteis.',
      data: dataRequest,
    };
  }

  /**
   * Obtém solicitações do usuário
   */
  @Get('data-requests')
  async getUserDataRequests(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = req.user.id;
    const requests = await this.dataRequestService.getUserDataRequests(userId);

    return {
      success: true,
      data: requests,
    };
  }

  /**
   * Obtém uma solicitação específica
   */
  @Get('data-requests/:id')
  async getDataRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) requestId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = req.user.id;
    const request = await this.dataRequestService.getDataRequest(requestId);

    // Verifica se a solicitação pertence ao usuário
    if (request.userId !== userId) {
      throw new HttpException('Acesso negado', HttpStatus.FORBIDDEN);
    }

    return {
      success: true,
      data: request,
    };
  }

  /**
   * Cancela uma solicitação
   */
  @Delete('data-requests/:id')
  async cancelDataRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) requestId: string,
  ): Promise<{ success: boolean; message: string; data: unknown }> {
    const userId = req.user.id;
    const request = await this.dataRequestService.cancelDataRequest(requestId, userId);

    return {
      success: true,
      message: 'Solicitação cancelada com sucesso',
      data: request,
    };
  }

  /**
   * Download de arquivo de portabilidade de dados
   */
  @Get('data-requests/:id/download')
  async downloadDataExport(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) requestId: string,
  ): Promise<void> {
    const userId = req.user.id;
    const request = await this.dataRequestService.getDataRequest(requestId);

    // Verifica se a solicitação pertence ao usuário
    if (request.userId !== userId) {
      throw new HttpException('Acesso negado', HttpStatus.FORBIDDEN);
    }

    // Verifica se a solicitação foi concluída e tem arquivo
    if (request.status !== DataRequestStatus.COMPLETED || !request.filePath) {
      throw new HttpException('Arquivo não disponível para download', HttpStatus.BAD_REQUEST);
    }

    // Verifica se o arquivo existe e tem integridade
    const fileInfo = await this.dataPortabilityService.getExportFileInfo(request.filePath);

    if (!fileInfo.exists) {
      throw new HttpException('Arquivo não encontrado', HttpStatus.NOT_FOUND);
    }

    if (request.fileHash && fileInfo.hash !== request.fileHash) {
      throw new HttpException(
        'Arquivo corrompido. Entre em contato com o suporte.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Configura headers para download
    const fileName = `dados-pessoais-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    if (fileInfo.size) {
      res.setHeader('Content-Length', fileInfo.size);
    }

    // Envia o arquivo
    res.sendFile(request.filePath, err => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
          });
        }
      }
    });
  }

  // === ENDPOINTS ADMINISTRATIVOS ===

  /**
   * Lista todas as solicitações (apenas administradores)
   */
  @Get('admin/data-requests')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllDataRequests(
    @Query('status') status?: DataRequestStatus,
    @Query('type') requestType?: DataRequestType,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{ success: boolean; data: unknown }> {
    const requests = await this.dataRequestService.getAllDataRequests(
      status,
      requestType,
      Number(page),
      Number(limit),
    );

    return {
      success: true,
      data: requests,
    };
  }

  /**
   * Atualiza uma solicitação (apenas administradores)
   */
  @Put('admin/data-requests/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateDataRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() updateDataRequestDto: UpdateDataRequestDto,
  ): Promise<{ success: boolean; message: string; data: unknown }> {
    const adminId = req.user.id;
    const request = await this.dataRequestService.updateDataRequest(
      requestId,
      updateDataRequestDto,
      adminId,
    );

    return {
      success: true,
      message: 'Solicitação atualizada com sucesso',
      data: request,
    };
  }

  /**
   * Obtém estatísticas de consentimentos (apenas administradores)
   */
  @Get('admin/statistics/consents')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getConsentStatistics(): Promise<{ success: boolean; data: unknown }> {
    const statistics = await this.consentService.getConsentStatistics();

    return {
      success: true,
      data: statistics,
    };
  }

  /**
   * Obtém estatísticas de solicitações (apenas administradores)
   */
  @Get('admin/statistics/data-requests')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getDataRequestStatistics(): Promise<{ success: boolean; data: unknown }> {
    const statistics = await this.dataRequestService.getDataRequestStatistics();

    return {
      success: true,
      data: statistics,
    };
  }

  /**
   * Obtém solicitações próximas do vencimento (apenas administradores)
   */
  @Get('admin/data-requests/near-due')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getRequestsNearDue(@Query('days') days = 3): Promise<{ success: boolean; data: unknown }> {
    const requests = await this.dataRequestService.getRequestsNearDueDate(Number(days));

    return {
      success: true,
      data: requests,
    };
  }
}
