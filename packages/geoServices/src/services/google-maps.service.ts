import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import type {
  GoogleMapsServiceInterface,
  GeocodeResponse,
  DistanceMatrixResponse,
  RouteResponse,
  PlaceAutocompleteResponse,
  PlaceDetailsResponse,
} from "../interfaces/google-maps.interface";

@Injectable()
export class GoogleMapsService implements GoogleMapsServiceInterface {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly client: Client;
  private readonly apiKey: string;
  private readonly timeout = 5000;
  private readonly baseUrl = "https://maps.googleapis.com/maps/api";

  constructor() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error("Google Maps API key is required");
    }

    this.apiKey = apiKey;
    this.client = new Client({});
  }

  async geocode(address: string): Promise<GeocodeResponse> {
    if (!address || address.trim().length === 0) {
      throw new BadRequestException("Endereço não pode ser vazio");
    }

    try {
      this.logger.log(`Geocoding address: ${address}`);

      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey,
        },
        timeout: this.timeout,
      });

      if (response.data.status !== "OK") {
        this.logger.error(`Geocoding failed: ${response.data.status}`);
        throw new NotFoundException(
          `Geocoding falhou: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log(`Geocoding successful for: ${address}`);
      return response.data as GeocodeResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in geocode: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException(
        "Não foi possível realizar o geocoding. Tente novamente mais tarde.",
      );
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResponse> {
    if (!this.validateCoordinates(lat, lng)) {
      throw new BadRequestException("Coordenadas inválidas");
    }

    try {
      this.logger.log(`Reverse geocoding coordinates: ${lat}, ${lng}`);

      const response = await this.client.reverseGeocode({
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
        },
        timeout: this.timeout,
      });

      if (response.data.status !== "OK") {
        this.logger.error(`Reverse geocoding failed: ${response.data.status}`);
        throw new NotFoundException(
          `Reverse geocoding falhou: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log(`Reverse geocoding successful for: ${lat}, ${lng}`);
      return response.data as GeocodeResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in reverseGeocode: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException(
        "Não foi possível realizar o reverse geocoding. Tente novamente mais tarde.",
      );
    }
  }

  async getDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode?: string,
  ): Promise<DistanceMatrixResponse> {
    if (!origins.length || !destinations.length) {
      throw new BadRequestException("Origens e destinos são obrigatórios");
    }

    try {
      this.logger.log(
        `Calculating distance matrix for ${origins.length} origins and ${destinations.length} destinations (mode: ${mode ?? "driving"})`,
      );

      const response = await this.client.distancematrix({
        params: {
          origins: origins,
          destinations: destinations,
          key: this.apiKey,
          ...(mode ? { mode: mode as TravelMode } : {}),
        },
        timeout: this.timeout,
      });

      if (response.data.status !== "OK") {
        this.logger.error(`Distance matrix failed: ${response.data.status}`);
        throw new NotFoundException(
          `Cálculo de matriz de distância falhou: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log("Distance matrix calculation successful");
      return response.data as DistanceMatrixResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in getDistanceMatrix: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException(
        "Não foi possível calcular a matriz de distância. Tente novamente mais tarde.",
      );
    }
  }

  async getRoutes(
    origin: string,
    destination: string,
    mode?: string,
    waypoints?: string[],
  ): Promise<RouteResponse> {
    if (!origin || !destination) {
      throw new BadRequestException("Origem e destino são obrigatórios");
    }

    try {
      this.logger.log(
        `Calculating route from ${origin} to ${destination}` +
          (mode ? ` (mode: ${mode})` : "") +
          (waypoints?.length ? ` with ${waypoints.length} waypoints` : ""),
      );

      const response = await this.client.directions({
        params: {
          origin: origin,
          destination: destination,
          ...(waypoints && waypoints.length > 0 ? { waypoints: waypoints } : {}),
          ...(mode ? { mode: mode as TravelMode } : {}),
          key: this.apiKey,
        },
        timeout: this.timeout,
      });

      if (response.data.status !== "OK") {
        this.logger.error(`Route calculation failed: ${response.data.status}`);
        throw new NotFoundException(
          `Cálculo de rota falhou: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log("Route calculation successful");
      return response.data as RouteResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in getRoutes: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException("Não foi possível calcular a rota. Tente novamente mais tarde.");
    }
  }

  private validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  async getRouteWithWaypoints(
    origin: string,
    destination: string,
    waypoints: string[],
    optimizeWaypoints = false,
  ): Promise<RouteResponse> {
    if (waypoints.length === 0) {
      return this.getRoutes(origin, destination);
    }

    try {
      this.logger.log(
        `Calculating route from ${origin} to ${destination} with ${waypoints.length} waypoints` +
          (optimizeWaypoints ? " (optimized)" : ""),
      );

      const response = await this.client.directions({
        params: {
          origin: origin,
          destination: destination,
          waypoints: waypoints,
          optimize: optimizeWaypoints,
          key: this.apiKey,
        },
        timeout: this.timeout,
      });

      if (response.data.status !== "OK") {
        this.logger.error(`Route with waypoints failed: ${response.data.status}`);
        throw new NotFoundException(
          `Cálculo de rota com waypoints falhou: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log("Route with waypoints calculation successful");
      return response.data as RouteResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in getRouteWithWaypoints: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException(
        "Não foi possível calcular a rota com waypoints. Tente novamente mais tarde.",
      );
    }
  }

  async placeAutocomplete(
    input: string,
    options?: {
      types?: string[];
      componentRestrictions?: { country: string };
      location?: { lat: number; lng: number };
      radius?: number;
    },
  ): Promise<PlaceAutocompleteResponse> {
    if (!input || input.trim().length === 0) {
      throw new BadRequestException("Entrada de busca não pode ser vazia");
    }

    try {
      this.logger.log(`Place autocomplete for: ${input}`);

      const params: any = {
        input: input.trim(),
        key: this.apiKey,
      };

      if (options?.types && options.types.length > 0) {
        params.types = options.types.join("|");
      }

      if (options?.componentRestrictions?.country) {
        params.components = `country:${options.componentRestrictions.country}`;
      }

      if (options?.location) {
        params.location = `${options.location.lat},${options.location.lng}`;
      }

      if (options?.radius) {
        params.radius = options.radius;
      }

      const response = await this.client.placeAutocomplete({
        params,
        timeout: this.timeout,
      });

      if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
        this.logger.error(`Place autocomplete failed: ${response.data.status}`);
        throw new NotFoundException(
          `Autocomplete falhou: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log(`Place autocomplete successful: ${response.data.predictions.length} results`);
      return response.data as PlaceAutocompleteResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in placeAutocomplete: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException(
        "Não foi possível realizar o autocomplete. Tente novamente mais tarde.",
      );
    }
  }

  async placeDetails(placeId: string): Promise<PlaceDetailsResponse> {
    if (!placeId || placeId.trim().length === 0) {
      throw new BadRequestException("Place ID não pode ser vazio");
    }

    try {
      this.logger.log(`Getting place details for: ${placeId}`);

      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
        },
        timeout: this.timeout,
      });

      if (response.data.status !== "OK") {
        this.logger.error(`Place details failed: ${response.data.status}`);
        throw new NotFoundException(
          `Detalhes do local falharam: ${response.data.error_message ?? response.data.status}`,
        );
      }

      this.logger.log(`Place details successful for: ${placeId}`);
      return response.data as PlaceDetailsResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(`Error in placeDetails: ${errorMessage}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException(
        "Não foi possível obter os detalhes do local. Tente novamente mais tarde.",
      );
    }
  }
}
