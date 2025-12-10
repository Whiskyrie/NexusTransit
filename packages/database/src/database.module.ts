import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createDataSourceOptions } from "./data-source.factory";
import { DatabaseConfigOptions } from "./interfaces/database-options.interface";

@Module({})
export class DatabaseModule {
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (
      ...args: any[]
    ) => Promise<DatabaseConfigOptions> | DatabaseConfigOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: options.imports || [],
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            const dataSourceOptions = createDataSourceOptions(config);
            return {
              ...dataSourceOptions,
              autoLoadEntities: config.autoLoadEntities,
            };
          },
          inject: options.inject || [],
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
