import { DataSource } from "typeorm";

/**
 * Providers para injeção de repositórios nos seeds
 *
 * Estes providers criam os repositórios do TypeORM usando o DataSource
 */
export const seedingProviders = [
  {
    provide: "DATA_SOURCE",
    useFactory: async () => {
      // DataSource será fornecido pelo módulo que importa o SeedingModule
      return null;
    },
  },
  {
    provide: "ROLE_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Role");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "USER_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("User");
    },
    inject: ["DATA_SOURCE"],
  },
];
