import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ClsService } from "nestjs-cls";

/**
 * Interface estendida do Request com propriedade user
 */
interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
  };
}

/**
 * Middleware para capturar contexto da requisição HTTP
 * e armazená-lo no ClsService para uso posterior no AuditSubscriber
 */
@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditContextMiddleware.name);

  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Extrair informações do usuário (pode vir do JWT após autenticação)
    const user = (req as RequestWithUser).user;

    // Extrair IP (considerar proxy)
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      req.ip;

    // Extrair User-Agent
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Armazenar no CLS para acesso posterior
    this.cls.set("user", user);
    this.cls.set("ip", ipAddress);
    this.cls.set("userAgent", userAgent);
    this.cls.set("request", {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: req.headers,
    });

    this.logger.debug(`Audit context captured: user=${user?.id || "anonymous"}, ip=${ipAddress}`);

    next();
  }
}
