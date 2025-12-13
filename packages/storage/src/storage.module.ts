import { Module, DynamicModule, Global, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { StorageService } from "./services/storage.service";
import storageConfig from "./config/storage.config";

@Global()
@Module({})
export class StorageModule {
  static forRoot(): DynamicModule {
    return {
      module: StorageModule,
      imports: [
        ConfigModule.forFeature(storageConfig),
        MulterModule.register({
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB máximo (pode ser sobrescrito pela config)
          },
        }),
      ],
      providers: [StorageService],
      exports: [StorageService],
    };
  }

  static forRootAsync(options?: {
    useFactory?: (...args: unknown[]) => Promise<unknown> | unknown;
    inject?: (string | symbol | Type<unknown>)[];
  }): DynamicModule {
    return {
      module: StorageModule,
      imports: [
        ConfigModule.forFeature(storageConfig),
        MulterModule.registerAsync({
          useFactory: options?.useFactory as never,
          inject: options?.inject as never,
        }),
      ],
      providers: [StorageService],
      exports: [StorageService],
    };
  }
}
