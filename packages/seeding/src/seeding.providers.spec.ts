import { DataSource } from "typeorm";
import { seedingProviders } from "./seeding.providers";

interface SeedingProvider {
  provide: string;
  useFactory: (...args: (DataSource | null | undefined)[]) => unknown;
  inject?: string[];
}

describe("seedingProviders", () => {
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({}),
    } as unknown as jest.Mocked<DataSource>;
  });

  it("should be defined", () => {
    expect(seedingProviders).toBeDefined();
    expect(Array.isArray(seedingProviders)).toBe(true);
  });

  it("should have DATA_SOURCE provider", () => {
    const dataSourceProvider = seedingProviders.find((p) => p.provide === "DATA_SOURCE");

    expect(dataSourceProvider).toBeDefined();
  });

  it("should have all required repository providers", () => {
    const requiredProviders = [
      "DATA_SOURCE",
      "ROLE_REPOSITORY",
      "USER_REPOSITORY",
      "SERVICE_ORDER_REPOSITORY",
      "CUSTOMER_REPOSITORY",
      "CUSTOMER_ADDRESS_REPOSITORY",
      "DRIVER_REPOSITORY",
      "DRIVER_LICENSE_REPOSITORY",
      "VEHICLE_REPOSITORY",
      "ROUTE_REPOSITORY",
      "ROUTE_STOP_REPOSITORY",
      "DELIVERY_REPOSITORY",
      "TRACKING_EVENT_REPOSITORY",
      "INCIDENT_REPOSITORY",
      "INCIDENT_COMMENT_REPOSITORY",
    ];

    requiredProviders.forEach((providerName) => {
      const provider = seedingProviders.find((p) => p.provide === providerName);
      expect(provider).toBeDefined();
    });
  });

  it("should throw error when DataSource is not provided", () => {
    const roleProvider = seedingProviders.find(
      (p) => p.provide === "ROLE_REPOSITORY",
    ) as SeedingProvider;

    expect(() => roleProvider.useFactory(null)).toThrow(
      "DataSource not provided to seeding module",
    );
  });

  it("should throw error for ALL repository providers when DataSource is null", () => {
    const repositoryProviders = seedingProviders.filter((p) => p.provide !== "DATA_SOURCE");

    repositoryProviders.forEach((provider) => {
      const factory = provider.useFactory as (
        ...args: (DataSource | null | undefined)[]
      ) => unknown;
      expect(() => factory(null)).toThrow("DataSource not provided to seeding module");
      expect(() => factory(undefined)).toThrow("DataSource not provided to seeding module");
    });
  });

  it("DATA_SOURCE factory should return null", async () => {
    const dataSourceProvider = seedingProviders.find(
      (p) => p.provide === "DATA_SOURCE",
    ) as SeedingProvider;
    const result = await dataSourceProvider.useFactory();
    expect(result).toBeNull();
  });

  it("should return repository when DataSource is provided", () => {
    const roleProvider = seedingProviders.find(
      (p) => p.provide === "ROLE_REPOSITORY",
    ) as SeedingProvider;

    const result = roleProvider.useFactory(mockDataSource);

    expect(result).toBeDefined();
    expect(mockDataSource.getRepository).toHaveBeenCalledWith("Role");
  });

  it("should inject DATA_SOURCE in all repository providers", () => {
    const repositoryProviders = seedingProviders.filter((p) => p.provide !== "DATA_SOURCE");

    repositoryProviders.forEach((provider) => {
      expect(provider.inject).toContain("DATA_SOURCE");
    });
  });

  it("should call getRepository with correct entity name", () => {
    const entityMappings: Record<string, string> = {
      ROLE_REPOSITORY: "Role",
      USER_REPOSITORY: "User",
      SERVICE_ORDER_REPOSITORY: "ServiceOrder",
      CUSTOMER_REPOSITORY: "Customer",
      CUSTOMER_ADDRESS_REPOSITORY: "CustomerAddress",
      DRIVER_REPOSITORY: "Driver",
      DRIVER_LICENSE_REPOSITORY: "DriverLicense",
      VEHICLE_REPOSITORY: "Vehicle",
      ROUTE_REPOSITORY: "Route",
      ROUTE_STOP_REPOSITORY: "RouteStop",
      DELIVERY_REPOSITORY: "Delivery",
      TRACKING_EVENT_REPOSITORY: "TrackingEvent",
      INCIDENT_REPOSITORY: "Incident",
      INCIDENT_COMMENT_REPOSITORY: "IncidentComment",
    };

    Object.entries(entityMappings).forEach(([providerName, entityName]) => {
      const provider = seedingProviders.find((p) => p.provide === providerName) as SeedingProvider;

      provider.useFactory(mockDataSource);
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(entityName);
    });
  });

  it("should have useFactory for all providers", () => {
    seedingProviders.forEach((provider) => {
      expect(provider).toHaveProperty("useFactory");
      expect(typeof provider.useFactory).toBe("function");
    });
  });

  it("should have correct number of providers", () => {
    expect(seedingProviders.length).toBe(15);
  });
});
