import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createDataSourceOptions } from "./data-source.factory";
import { DatabaseConfigOptions } from "./interfaces/database-options.interface";

@Module({})
export class DatabaseModule {
  static forRootAsync(options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imports?: any[];
    useFactory: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => Promise<DatabaseConfigOptions> | DatabaseConfigOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: options.imports || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
