export interface GoogleMapsConfig {
  apiKey: string;
  timeout?: number;
  baseUrl?: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}

export interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  place_id: string;
  types: string[];
}

export interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: DistanceMatrixRow[];
  status: string;
}

export interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

export interface DistanceMatrixElement {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
}

export interface RouteResponse {
  routes: Route[];
  status: string;
}

export interface Route {
  legs: RouteLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
}

export interface RouteLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_address: string;
  start_address: string;
  steps: RouteStep[];
}

export interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  instructions: string;
  polyline: {
    points: string;
  };
  travel_mode: string;
}

export interface PlaceAutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

export interface PlaceAutocompleteResponse {
  predictions: PlaceAutocompletePrediction[];
  status: string;
}

export interface PlaceDetailsResponse {
  result: {
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
    types: string[];
  };
  status: string;
}

export interface GoogleMapsServiceInterface {
  geocode(address: string): Promise<GeocodeResponse>;
  reverseGeocode(lat: number, lng: number): Promise<GeocodeResponse>;
  getDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode?: string,
  ): Promise<DistanceMatrixResponse>;
  getRoutes(
    origin: string,
    destination: string,
    mode?: string,
    waypoints?: string[],
  ): Promise<RouteResponse>;
  placeAutocomplete(
    input: string,
    options?: {
      types?: string[];
      componentRestrictions?: { country: string };
      location?: { lat: number; lng: number };
      radius?: number;
    },
  ): Promise<PlaceAutocompleteResponse>;
  placeDetails(placeId: string): Promise<PlaceDetailsResponse>;
}
