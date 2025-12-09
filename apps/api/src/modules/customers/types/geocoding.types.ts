/**
 * Represents a single result from the Nominatim search API.
 * We only define the properties we use, but more could be added.
 */
export interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Represents the response from the Nominatim reverse geocoding API.
 * `display_name` is present on success, `error` on failure.
 */
export interface NominatimReverseResult {
  display_name?: string;
  error?: string;
}
