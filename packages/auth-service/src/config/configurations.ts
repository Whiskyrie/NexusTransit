import type { ConfigFactory } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import storageConfig from './storage.config';

const configurations = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  storageConfig,
] as ConfigFactory[];

export default configurations;

export { appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig };
