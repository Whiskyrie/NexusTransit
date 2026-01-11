import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Package, Clock, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/Button";
import { TrackingMap } from "../components/tracking/TrackingMap";
import { TrackingTimeline } from "../components/tracking/TrackingTimeline";
import { trackingService } from "../services/tracking.service";
import { useToast } from "../components/ui/ToastContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TrackingPage() {
  const { trackingCode: urlTrackingCode } = useParams<{ trackingCode?: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [trackingCode, setTrackingCode] = useState(urlTrackingCode || "");
  const [searchCode, setSearchCode] = useState(urlTrackingCode || "");
  const previousDataRef = useRef<typeof timelineData | null>(null);

  // Query para dados do mapa (polling a cada 15s)
  const {
    data: mapData,
    isLoading: isLoadingMap,
    error: mapError,
    refetch: refetchMap,
  } = useQuery({
    queryKey: ["tracking-map", searchCode],
    queryFn: () => trackingService.getMapData(searchCode),
    enabled: !!searchCode && searchCode.length >= 3,
    refetchInterval: 15000, // 15s (≤4/min, dentro do rate limit de 10/min)
    retry: 1,
  });

  // Query para timeline (polling a cada 30s)
  const {
    data: timelineData,
    isLoading: isLoadingTimeline,
    error: timelineError,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ["tracking-timeline", searchCode],
    queryFn: () => trackingService.getTimeline(searchCode),
    enabled: !!searchCode && searchCode.length >= 3,
    refetchInterval: 30000, // 30s (≤2/min, dentro do rate limit de 15/min)
    retry: 1,
  });

  // Query para dados completos (polling a cada 60s)
  const {
    data: trackingData,
    isLoading: isLoadingTracking,
    error: trackingError,
  } = useQuery({
    queryKey: ["tracking", searchCode],
    queryFn: () => trackingService.trackByCode(searchCode),
    enabled: !!searchCode && searchCode.length >= 3,
    refetchInterval: 60000, // 60s (≤1/min)
    retry: 1,
  });

  // Detecção de atualizações e notificações
  useEffect(() => {
    if (!timelineData || !previousDataRef.current) {
      previousDataRef.current = timelineData;
      return;
    }

    const previous = previousDataRef.current;

    // Detectar novo evento
    if (timelineData.total_events > previous.total_events) {
      const newEvent = timelineData.events[timelineData.events.length - 1];
      addToast(
        `Novo evento: ${newEvent.event_type.replace(/_/g, " ")}`,
        newEvent.event_status === "ERROR" ? "error" : "info",
      );
    }

    // Detectar mudança de status
    if (timelineData.current_status !== previous.current_status) {
      addToast(`Status atualizado para: ${timelineData.current_status}`, "info");
    }

    previousDataRef.current = timelineData;
  }, [timelineData, addToast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim().length < 3) {
      addToast("Código de rastreamento deve ter pelo menos 3 caracteres", "warning");
      return;
    }
    setSearchCode(trackingCode.trim());
    navigate(`/tracking/${trackingCode.trim()}`);
  };

  const handleRefresh = () => {
    refetchMap();
    refetchTimeline();
    addToast("Dados atualizados", "success");
  };

  const isLoading = isLoadingMap || isLoadingTimeline || isLoadingTracking;
  const error = mapError || timelineError || trackingError;

  // Estado: erro 404
  if (error && "response" in error && (error.response as { status?: number })?.status === 404) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Código não encontrado</h2>
          <p className="text-gray-500 mb-6">
            O código de rastreamento "{searchCode}" não foi encontrado em nosso sistema.
          </p>
          <Button onClick={() => setSearchCode("")} variant="primary">
            Tentar outro código
          </Button>
        </div>
      </div>
    );
  }

  // Estado: erro 429 (rate limit)
  if (error && "response" in error && (error.response as { status?: number })?.status === 429) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Muitas requisições</h2>
          <p className="text-gray-500 mb-6">
            Por favor, aguarde alguns segundos antes de fazer uma nova busca.
          </p>
          <Button onClick={() => setSearchCode("")} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Estado: erro genérico
  if (error && searchCode) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 mx-auto mb-4 text-red-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-500 mb-6">
            Ocorreu um erro ao buscar informações do rastreamento. Tente novamente.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRefresh} variant="primary">
              Tentar novamente
            </Button>
            <Button onClick={() => setSearchCode("")} variant="outline">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Rastreamento de Entregas</h1>
          {searchCode && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="Digite o código de rastreamento (ex: NEX20250110001)"
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
            />
          </div>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {/* Status atual */}
        {trackingData && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Status Atual
              </div>
              <div className="text-lg font-bold text-indigo-600">
                {trackingData.current_status.replace(/_/g, " ")}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Última Atualização
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {trackingData.last_update
                  ? format(new Date(trackingData.last_update), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })
                  : "—"}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Previsão de Entrega
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {trackingData.estimated_delivery_at
                  ? format(new Date(trackingData.estimated_delivery_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })
                  : "Não informada"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid principal: Mapa + Timeline */}
      {mapData && timelineData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Mapa (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa */}
            <div className="h-125">
              <TrackingMap mapData={mapData} />
            </div>

            {/* Cards de origem e destino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                      Origem
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {trackingData?.origin.city}, {trackingData?.origin.state}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {trackingData?.origin.address}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                      Destino
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {trackingData?.destination.city}, {trackingData?.destination.state}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {trackingData?.destination.address}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita: Timeline (1/3) */}
          <div className="lg:col-span-1">
            <TrackingTimeline events={timelineData.events} />
          </div>
        </div>
      ) : (
        !error &&
        searchCode && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin" />
              <p className="text-gray-500 font-medium">Carregando dados do rastreamento...</p>
            </div>
          </div>
        )
      )}

      {/* Estado vazio inicial */}
      {!searchCode && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Acompanhe sua entrega em tempo real
            </h3>
            <p className="text-gray-500">
              Digite o código de rastreamento acima para visualizar o status, localização atual e
              histórico completo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
