import { useEffect, useRef, useState } from "react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { MapPin, Navigation } from "lucide-react";
import type { PublicTrackingMap } from "../../types/tracking.types";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface TrackingMapProps {
  mapData: PublicTrackingMap;
}

export function TrackingMap({ mapData }: TrackingMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Criar GeoJSON da rota apenas se houver pontos
  const routeGeoJSON =
    mapData.route.length > 0
      ? {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: mapData.route.map((point) => [point.longitude, point.latitude]),
          },
          properties: {},
        }
      : null;

  // Ajustar bounds quando o mapa carregar ou dados mudarem
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const points: [number, number][] = [
      [mapData.origin.longitude, mapData.origin.latitude],
      [mapData.destination.longitude, mapData.destination.latitude],
    ];

    if (mapData.current_location) {
      points.push([mapData.current_location.longitude, mapData.current_location.latitude]);
    }

    if (points.length > 0) {
      try {
        const bounds = points.reduce(
          (bounds, coord) => bounds.extend(coord as [number, number]),
          new mapboxgl.LngLatBounds(points[0], points[0]),
        );

        mapRef.current.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 1000,
        });
      } catch (error) {
        console.warn("Error fitting bounds:", error);
      }
    }
  }, [mapData, mapLoaded]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-gray-100/50 shadow-sm">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: mapData.origin.latitude || -23.55,
          longitude: mapData.origin.longitude || -46.63,
          zoom: 12,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={() => setMapLoaded(true)}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Linha da rota - apenas se houver dados */}
        {routeGeoJSON && (
          <Source type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#6366f1",
                "line-width": 4,
                "line-opacity": 0.8,
              }}
            />
          </Source>
        )}

        {/* Marcador de origem */}
        <Marker latitude={mapData.origin.latitude} longitude={mapData.origin.longitude}>
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-emerald-500 border-3 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            {mapData.origin.address && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Origem
              </div>
            )}
          </div>
        </Marker>

        {/* Marcador de destino */}
        <Marker latitude={mapData.destination.latitude} longitude={mapData.destination.longitude}>
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-red-500 border-3 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            {mapData.destination.address && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Destino
              </div>
            )}
          </div>
        </Marker>

        {/* Marcador de localização atual (pulsante) */}
        {mapData.current_location && (
          <Marker
            latitude={mapData.current_location.latitude}
            longitude={mapData.current_location.longitude}
          >
            <div className="relative group cursor-pointer">
              {/* Pulso animado */}
              <div className="absolute inset-0 w-14 h-14 -translate-x-2 -translate-y-2">
                <div className="absolute inset-0 bg-indigo-400 rounded-full opacity-50 animate-ping" />
              </div>
              {/* Marcador principal */}
              <div className="relative w-10 h-10 rounded-full bg-indigo-600 border-3 border-white shadow-xl flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              {mapData.current_location.address && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Localização Atual
                </div>
              )}
            </div>
          </Marker>
        )}
      </Map>

      {/* Legenda de distância (overlay) */}
      {(mapData.total_distance_km || mapData.remaining_distance_km) && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100/50">
          <div className="flex gap-4 text-sm">
            {mapData.total_distance_km && (
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                  Total
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {mapData.total_distance_km.toFixed(1)} km
                </div>
              </div>
            )}
            {mapData.remaining_distance_km && (
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                  Restante
                </div>
                <div className="text-lg font-bold text-indigo-600">
                  {mapData.remaining_distance_km.toFixed(1)} km
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
