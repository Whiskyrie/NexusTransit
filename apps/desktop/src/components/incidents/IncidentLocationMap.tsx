/**
 * Mapa de localização do incidente
 */

import { memo } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

interface IncidentLocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

export const IncidentLocationMap = memo(function IncidentLocationMap({
  latitude,
  longitude,
  address,
}: IncidentLocationMapProps) {
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Localização não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
        <Map
          initialViewState={{
            latitude,
            longitude,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <Marker latitude={latitude} longitude={longitude} anchor="bottom">
            <div className="bg-red-600 rounded-full p-2 shadow-lg">
              <MapPin className="w-5 h-5 text-white" fill="currentColor" />
            </div>
          </Marker>
        </Map>
      </div>

      {address && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700">{address}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Lat: {latitude.toFixed(6)}</span>
        <span>Lng: {longitude.toFixed(6)}</span>
      </div>
    </div>
  );
});
