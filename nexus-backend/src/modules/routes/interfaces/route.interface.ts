/**
 * Route Interface
 *
 * Interface TypeScript para a entidade Route.
 *
 * @module Routes/Interfaces
 */

import type { RouteStatus } from '../enums/route-status';
import type { RouteType } from '../enums/route-type';

/**
 * Interface completa para Route
 *
 * Define a estrutura de dados de uma rota no sistema
 */
export interface IRoute {
  /**
   * ID único da rota (UUID)
   */
  id: string;

  /**
   * Código único da rota
   * Formato: RT-YYYYMMDD-XXX
   */
  route_code: string;

  /**
   * Nome identificador da rota
   */
  name: string;

  /**
   * Descrição detalhada (opcional)
   */
  description?: string;

  /**
   * ID do veículo designado
   */
  vehicle_id: string;

  /**
   * ID do motorista designado
   */
  driver_id: string;

  /**
   * Status atual da rota
   */
  status: RouteStatus;

  /**
   * Tipo da rota
   */
  type: RouteType;

  /**
   * Endereço de origem
   */
  origin_address: string;

  /**
   * Coordenadas de origem (formato GeoJSON ou "lat,lng")
   */
  origin_coordinates?: string;

  /**
   * Endereço de destino
   */
  destination_address: string;

  /**
   * Coordenadas de destino (formato GeoJSON ou "lat,lng")
   */
  destination_coordinates?: string;

  /**
   * Data planejada de execução
   */
  planned_date: Date;

  /**
   * Horário planejado de início (formato HH:mm)
   */
  planned_start_time?: string;

  /**
   * Horário planejado de término (formato HH:mm)
   */
  planned_end_time?: string;

  /**
   * Horário real de início
   */
  actual_start_time?: Date;

  /**
   * Horário real de término
   */
  actual_end_time?: Date;

  /**
   * Distância estimada em quilômetros
   */
  estimated_distance_km?: number;

  /**
   * Distância real percorrida em quilômetros
   */
  actual_distance_km?: number;

  /**
   * Duração estimada em minutos
   */
  estimated_duration_minutes?: number;

  /**
   * Duração real em minutos
   */
  actual_duration_minutes?: number;

  /**
   * Carga total em quilogramas
   */
  total_load_kg?: number;

  /**
   * Volume total em metros cúbicos
   */
  total_volume_m3?: number;

  /**
   * Nível de dificuldade (1-5)
   */
  difficulty_level?: number;

  /**
   * Observações gerais
   */
  notes?: string;

  /**
   * Data de criação
   */
  created_at: Date;

  /**
   * Data de última atualização
   */
  updated_at: Date;

  /**
   * Data de exclusão lógica (soft delete)
   */
  deleted_at?: Date;
}
