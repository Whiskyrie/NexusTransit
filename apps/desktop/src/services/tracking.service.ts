import { api } from "./api";
import type {
  PublicTrackingResponse,
  PublicTrackingTimeline,
  PublicTrackingMap,
} from "../types/tracking.types";

export const trackingService = {
  /**
   * Busca rastreamento completo por código
   */
  async trackByCode(trackingCode: string): Promise<PublicTrackingResponse> {
    const response = await api.get<PublicTrackingResponse>(`/public/tracking/${trackingCode}`);
    return response.data;
  },

  /**
   * Busca timeline de eventos
   */
  async getTimeline(trackingCode: string): Promise<PublicTrackingTimeline> {
    const response = await api.get<PublicTrackingTimeline>(
      `/public/tracking/${trackingCode}/timeline`,
    );
    return response.data;
  },

  /**
   * Busca dados do mapa (coordenadas, rota)
   */
  async getMapData(trackingCode: string): Promise<PublicTrackingMap> {
    const response = await api.get<PublicTrackingMap>(`/public/tracking/${trackingCode}/map`);
    return response.data;
  },
};
