export interface GeoServicesConfig {
  googleMaps: {
    apiKey: string;
    timeout?: number;
    baseUrl?: string;
  };
  viaCep: {
    timeout?: number;
    baseUrl?: string;
  };
}

export const DEFAULT_GEO_SERVICES_CONFIG: GeoServicesConfig = {
  googleMaps: {
    apiKey: "",
    timeout: 5000,
    baseUrl: "https://maps.googleapis.com/maps/api",
  },
  viaCep: {
    timeout: 3000,
    baseUrl: "https://viacep.com.br/ws",
  },
};
