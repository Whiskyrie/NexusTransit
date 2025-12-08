import type { Params } from 'nestjs-pino';
import { stdSerializers, stdTimeFunctions } from 'pino';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Interface para estender o Request padrão do Node/Express/Fastify
 * Adiciona propriedades injetadas por middlewares (user, id, etc)
 */
interface ExtendedRequest extends IncomingMessage {
  id: string | number;
  ip?: string;
  user?: {
    id?: string | number;
  };
  originalUrl?: string;
  headers: IncomingMessage['headers'] & {
    'x-correlation-id'?: string;
  };
}

/**
 * Configuração do Pino Logger
 *
 * - Desenvolvimento: Pretty print colorido para debug fácil
 * - Produção: JSON estruturado para agregação de logs
 * - Redaction automática de dados sensíveis
 * - Serializers para req/res/err
 * - Correlation IDs automáticos
 */
export const getPinoConfig = (): Params => {
  // Forçar detecção de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  // Logs de debug da inicialização (mantidos como console.log pois o logger ainda não existe)

  return {
    pinoHttp: {
      // Nível de log
      level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),

      // Serializers padrão para formatar objetos complexos
      serializers: {
        req: stdSerializers.req,
        res: stdSerializers.res,
        err: stdSerializers.err,
      },

      // Redact automático de dados sensíveis
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'req.body.accessToken',
          'req.body.refreshToken',
          'req.body.old_password',
          'req.body.new_password',
          '*.password',
          '*.token',
          '*.accessToken',
          '*.refreshToken',
        ],
        remove: true,
      },

      // Campos base em todos os logs
      base: {
        env: process.env.NODE_ENV ?? 'development',
        app: 'nexus-transit',
      },

      // Configuração de transporte (Pretty Print em Dev)
      // Usa spread operator condicional para evitar passar 'undefined' (Erro TS2322)
      ...(isDevelopment
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),

      // Timestamp em formato ISO
      timestamp: stdTimeFunctions.isoTime,

      // Propriedades customizadas extraídas de cada request
      customProps: (req: IncomingMessage) => {
        const typedReq = req as ExtendedRequest;
        return {
          correlationId: typedReq.headers['x-correlation-id'] ?? typedReq.id,
          userId: typedReq.user?.id,
          userAgent: typedReq.headers['user-agent'],
          // typedReq.socket acessa a definição nativa de IncomingMessage
          ip: typedReq.ip ?? typedReq.socket?.remoteAddress,
        };
      },

      // Desabilitar auto-logging para rotas específicas (health checks, métricas)
      autoLogging: {
        ignore: (req: IncomingMessage) => {
          const url = req.url ?? '';
          const ignoredPaths = ['/health', '/health/live', '/health/ready', '/metrics'];
          return ignoredPaths.some(path => url.startsWith(path));
        },
      },

      // Personalizar nível de log baseado no status
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (res.statusCode >= 500 || err) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },

      // Personalizar mensagem de sucesso
      customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
        return `${req.method} ${req.url} - ${res.statusCode}`;
      },

      // Personalizar mensagem de erro
      customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
        return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
      },
    },
  };
};
