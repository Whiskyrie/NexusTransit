import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RedisService } from './modules/redis/redis.service';

@ApiTags('App')
@Controller('api')
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  getHello(): string {
    return 'Hello World! - NexusTransit API - está funcionando!';
  }

  @Get('test-redis')
  async testRedis(): Promise<{
    status: string;
    message: string;
    results?: {
      set: boolean;
      get: string | undefined;
      has: boolean;
    };
    error?: string;
  }> {
    try {
      // Testa escrita
      const setResult = await this.redisService.set('test-key', 'Hello Redis!', 60000);

      // Testa leitura
      const getValue = await this.redisService.get<string>('test-key');

      // Testa verificação de existência
      const hasKey = await this.redisService.has('test-key');

      return {
        status: 'success',
        message: 'Redis conectado com sucesso!',
        results: {
          set: setResult,
          get: getValue,
          has: hasKey,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        status: 'error',
        message: 'Erro ao conectar com Redis',
        error: errorMessage,
      };
    }
  }
}
