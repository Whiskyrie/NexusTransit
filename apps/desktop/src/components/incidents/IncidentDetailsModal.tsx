/**
 * Modal de detalhes do incidente
 */

import { useState, useEffect } from "react";
import { X, User, Truck, Package, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { IncidentStatusBadge } from "./IncidentStatusBadge";
import { IncidentAttachments } from "./IncidentAttachments";
import { IncidentCommentThread } from "./IncidentCommentThread";
import { IncidentStatusTimeline } from "./IncidentStatusTimeline";
import { IncidentLocationMap } from "./IncidentLocationMap";
import { Select } from "../ui/Select";
import { incidentService } from "../../services/incident.service";
import type { Incident } from "../../types/incident.types";
import { IncidentStatus, IncidentStatusLabels } from "../../types/incident.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IncidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
}

type TabType = "details" | "attachments" | "comments" | "history";

export function IncidentDetailsModal({ isOpen, onClose, incident }: IncidentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Buscar detalhes completos do incidente
  const {
    data: fullIncident,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["incident-details", incident?.id],
    queryFn: () => incidentService.getById(incident!.id),
    enabled: !!incident?.id && isOpen,
  });

  // Buscar comentários
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["incident-comments", incident?.id],
    queryFn: () => incidentService.getComments(incident!.id),
    enabled: !!incident?.id && isOpen && activeTab === "comments",
  });

  // Buscar histórico de status
  const { data: statusHistory = [] } = useQuery({
    queryKey: ["incident-status-history", incident?.id],
    queryFn: () => incidentService.getStatusHistory(incident!.id),
    enabled: !!incident?.id && isOpen && activeTab === "history",
  });

  // Buscar anexos
  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ["incident-attachments", incident?.id],
    queryFn: () => incidentService.getAttachments(incident!.id),
    enabled: !!incident?.id && isOpen && activeTab === "attachments",
  });

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("details");
    }
  }, [isOpen]);

  if (!isOpen || !incident) return null;

  const handleAddComment = async (content: string) => {
    await incidentService.addComment(incident.id, { comment_text: content });
    refetchComments();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    await incidentService.deleteAttachment(attachmentId);
    refetchAttachments();
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await incidentService.updateStatus(incident.id, { status: newStatus as IncidentStatus });
      refetch();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const displayIncident = fullIncident || incident;

  // Mapa de transições válidas de status (deve refletir o backend)
  const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
    [IncidentStatus.REPORTED]: [IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED],
    [IncidentStatus.INVESTIGATING]: [
      IncidentStatus.IN_PROGRESS,
      IncidentStatus.ESCALATED,
      IncidentStatus.CLOSED,
    ],
    [IncidentStatus.IN_PROGRESS]: [
      IncidentStatus.RESOLVED,
      IncidentStatus.ESCALATED,
      IncidentStatus.INVESTIGATING,
    ],
    [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED, IncidentStatus.IN_PROGRESS],
    [IncidentStatus.ESCALATED]: [
      IncidentStatus.IN_PROGRESS,
      IncidentStatus.RESOLVED,
      IncidentStatus.CLOSED,
    ],
    [IncidentStatus.CLOSED]: [IncidentStatus.INVESTIGATING],
  };

  const currentStatus = displayIncident.status as IncidentStatus;
  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || [];

  // Mostrar status atual + transições válidas
  const statusOptions = [
    { value: currentStatus, label: IncidentStatusLabels[currentStatus] },
    ...allowedStatuses.map((status) => ({
      value: status,
      label: IncidentStatusLabels[status],
    })),
  ];

  const tabs: { id: TabType; label: string }[] = [
    { id: "details", label: "Detalhes" },
    { id: "attachments", label: "Anexos" },
    { id: "comments", label: "Comentários" },
    { id: "history", label: "Histórico" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#F8F9FC] w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {displayIncident.incident_number}
                </h2>
                <div className="w-48">
                  <Select
                    value={displayIncident.status}
                    onChange={handleStatusChange}
                    options={statusOptions}
                    disabled={isUpdatingStatus}
                    compact
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">{displayIncident.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-1 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer active:opacity-70 ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Informações Básicas
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Título</p>
                        <p className="text-base text-gray-900">{displayIncident.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Descrição</p>
                        <p className="text-base text-gray-700 whitespace-pre-wrap">
                          {displayIncident.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Reportado em</p>
                          <p className="text-sm text-gray-900">
                            {format(new Date(displayIncident.reported_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {displayIncident.resolved_at && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Resolvido em</p>
                            <p className="text-sm text-gray-900">
                              {format(new Date(displayIncident.resolved_at), "dd/MM/yyyy HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Entidades Relacionadas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Entidades Relacionadas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">Motorista</p>
                          <p className="text-base text-gray-900 truncate">
                            {displayIncident.driver?.full_name || displayIncident.driver_id}
                          </p>
                        </div>
                      </div>

                      {displayIncident.vehicle && (
                        <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500">Veículo</p>
                            <p className="text-base text-gray-900 truncate">
                              {displayIncident.vehicle.license_plate}
                            </p>
                          </div>
                        </div>
                      )}

                      {displayIncident.delivery_id && (
                        <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500">Entrega</p>
                            <p className="text-base text-gray-900 truncate font-mono">
                              {displayIncident.delivery_id}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Localização */}
                  {displayIncident.latitude && displayIncident.longitude && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Localização</h3>
                      <IncidentLocationMap
                        latitude={displayIncident.latitude}
                        longitude={displayIncident.longitude}
                        address={displayIncident.location_address}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "attachments" && (
                <IncidentAttachments attachments={attachments} onDelete={handleDeleteAttachment} />
              )}

              {activeTab === "comments" && (
                <IncidentCommentThread comments={comments} onAddComment={handleAddComment} />
              )}

              {activeTab === "history" && <IncidentStatusTimeline history={statusHistory} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
