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
  {
    provide: "SERVICE_ORDER_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("ServiceOrder");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "CUSTOMER_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Customer");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "CUSTOMER_ADDRESS_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("CustomerAddress");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "DRIVER_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Driver");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "DRIVER_LICENSE_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("DriverLicense");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "VEHICLE_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Vehicle");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "ROUTE_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Route");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "ROUTE_STOP_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("RouteStop");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "DELIVERY_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Delivery");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "TRACKING_EVENT_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("TrackingEvent");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "INCIDENT_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("Incident");
    },
    inject: ["DATA_SOURCE"],
  },
  {
    provide: "INCIDENT_COMMENT_REPOSITORY",
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        throw new Error("DataSource not provided to seeding module");
      }
      return dataSource.getRepository("IncidentComment");
    },
    inject: ["DATA_SOURCE"],
  },
];
