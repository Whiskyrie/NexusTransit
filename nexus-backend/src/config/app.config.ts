import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.API_PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
  }),
);
