import { RouteStatus } from "../../types/route.types";
import { Button } from "../ui/Button";
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Zap, MoreVertical } from "lucide-react";
import { useState } from "react";

interface RouteActionsProps {
  routeId: string;
  status: RouteStatus;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onOptimize: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function RouteActions({
  routeId,
  status,
  onStart,
  onPause,
  onResume,
  onComplete,
  onCancel,
  onOptimize,
  onViewDetails,
}: RouteActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const canStart = status === RouteStatus.PLANNED;
  const canPause = status === RouteStatus.IN_PROGRESS;
  const canResume = status === RouteStatus.PAUSED;
  const canComplete = status === RouteStatus.IN_PROGRESS;
  const canCancel = status === RouteStatus.PLANNED || status === RouteStatus.PAUSED;
  const canOptimize = status === RouteStatus.PLANNED || status === RouteStatus.PAUSED;

  const handleAction = async (action: () => void) => {
    setShowDropdown(false);
    action();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Primary Actions */}
        {canStart && (
          <Button variant="primary" onClick={() => onStart(routeId)} className="h-9! px-3!">
            <Play className="w-4 h-4" strokeWidth={1.5} />
            Iniciar
          </Button>
        )}

        {canPause && (
          <Button variant="outline" onClick={() => onPause(routeId)} className="h-9! px-3!">
            <Pause className="w-4 h-4" strokeWidth={1.5} />
            Pausar
          </Button>
        )}

        {canResume && (
          <Button variant="primary" onClick={() => onResume(routeId)} className="h-9! px-3!">
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            Retomar
          </Button>
        )}

        {canComplete && (
          <Button
            variant="primary"
            onClick={() => onComplete(routeId)}
            className="h-9! px-3! bg-[#10B981]! hover:bg-[#059669]!"
          >
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            Concluir
          </Button>
        )}

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-20">
                {canOptimize && (
                  <button
                    onClick={() => handleAction(() => onOptimize(routeId))}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
                    Otimizar Rota
                  </button>
                )}

                <button
                  onClick={() => handleAction(() => onViewDetails(routeId))}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors"
                >
                  Ver Detalhes
                </button>

                {canCancel && (
                  <>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => handleAction(() => onCancel(routeId))}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                    >
                      <XCircle className="w-4 h-4" strokeWidth={1.5} />
                      Cancelar Rota
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
