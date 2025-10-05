/**
 * Interface para janela de tempo de entrega
 */
export interface TimeWindow {
  start: Date;
  end: Date;
}

/**
 * Utilitários para validação e manipulação de janelas de tempo de entrega
 *
 * Fornece métodos para:
 * - Validar janelas de tempo
 * - Verificar se um horário está dentro da janela
 * - Encontrar próxima janela disponível
 * - Calcular duração de janelas
 *
 * @class TimeWindowUtils
 */
export class TimeWindowUtils {
  /**
   * Duração mínima de uma janela de tempo em minutos
   */
  private static readonly MIN_WINDOW_DURATION_MINUTES = 30;

  /**
   * Duração máxima de uma janela de tempo em horas
   */
  private static readonly MAX_WINDOW_DURATION_HOURS = 8;

  /**
   * Valida uma janela de tempo
   *
   * Critérios:
   * - Data de início deve ser anterior à data de fim
   * - Duração mínima de 30 minutos
   * - Duração máxima de 8 horas
   * - Ambas as datas devem ser válidas
   *
   * @param start - Data/hora de início
   * @param end - Data/hora de fim
   * @returns true se a janela é válida
   *
   * @example
   * ```typescript
   * const valid = TimeWindowUtils.validateTimeWindow(
   *   new Date('2025-10-05T08:00:00'),
   *   new Date('2025-10-05T12:00:00')
   * );
   * // Retorna: true
   * ```
   */
  static validateTimeWindow(start: Date, end: Date): boolean {
    // Verifica se são datas válidas
    if (!(start instanceof Date) || !(end instanceof Date)) {
      return false;
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Início deve ser antes do fim
    if (start >= end) {
      return false;
    }

    // Calcula duração
    const durationMinutes = this.calculateDurationMinutes(start, end);

    // Verifica duração mínima
    if (durationMinutes < this.MIN_WINDOW_DURATION_MINUTES) {
      return false;
    }

    // Verifica duração máxima
    const maxDurationMinutes = this.MAX_WINDOW_DURATION_HOURS * 60;
    if (durationMinutes > maxDurationMinutes) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se um horário está dentro de uma janela de tempo
   *
   * @param time - Horário a ser verificado
   * @param window - Janela de tempo
   * @returns true se o horário está dentro da janela
   *
   * @example
   * ```typescript
   * const isWithin = TimeWindowUtils.isWithinTimeWindow(
   *   new Date('2025-10-05T10:00:00'),
   *   { start: new Date('2025-10-05T08:00:00'), end: new Date('2025-10-05T12:00:00') }
   * );
   * // Retorna: true
   * ```
   */
  static isWithinTimeWindow(time: Date, window: TimeWindow): boolean {
    if (!(time instanceof Date) || isNaN(time.getTime())) {
      return false;
    }

    return time >= window.start && time <= window.end;
  }

  /**
   * Encontra a próxima janela disponível a partir de uma lista
   *
   * @param windows - Lista de janelas de tempo
   * @param fromTime - Horário de referência (padrão: agora)
   * @returns Próxima janela disponível ou null
   *
   * @example
   * ```typescript
   * const nextWindow = TimeWindowUtils.getNextAvailableWindow(windows);
   * if (nextWindow) {
   *   console.log(`Próxima entrega disponível: ${nextWindow.start}`);
   * }
   * ```
   */
  static getNextAvailableWindow(
    windows: TimeWindow[],
    fromTime: Date = new Date(),
  ): TimeWindow | null {
    if (!windows || windows.length === 0) {
      return null;
    }

    // Filtra janelas futuras e ordena por data de início
    const futureWindows = windows
      .filter(w => w.start > fromTime)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    return futureWindows[0] ?? null;
  }

  /**
   * Calcula a duração de uma janela de tempo em minutos
   *
   * @param start - Data/hora de início
   * @param end - Data/hora de fim
   * @returns Duração em minutos
   */
  static calculateDurationMinutes(start: Date, end: Date): number {
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Calcula a duração de uma janela de tempo em horas
   *
   * @param start - Data/hora de início
   * @param end - Data/hora de fim
   * @returns Duração em horas
   */
  static calculateDurationHours(start: Date, end: Date): number {
    const durationMinutes = this.calculateDurationMinutes(start, end);
    return Math.round((durationMinutes / 60) * 100) / 100;
  }

  /**
   * Verifica se duas janelas de tempo se sobrepõem
   *
   * @param window1 - Primeira janela
   * @param window2 - Segunda janela
   * @returns true se há sobreposição
   */
  static doWindowsOverlap(window1: TimeWindow, window2: TimeWindow): boolean {
    return window1.start < window2.end && window1.end > window2.start;
  }

  /**
   * Formata uma janela de tempo para exibição
   *
   * @param window - Janela de tempo
   * @returns String formatada (ex: "08:00 - 12:00")
   */
  static formatTimeWindow(window: TimeWindow): string {
    const formatTime = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    return `${formatTime(window.start)} - ${formatTime(window.end)}`;
  }

  /**
   * Cria uma janela de tempo a partir de uma data base e duração
   *
   * @param startTime - Horário de início
   * @param durationHours - Duração em horas
   * @returns Janela de tempo
   */
  static createTimeWindow(startTime: Date, durationHours: number): TimeWindow {
    const end = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    return {
      start: startTime,
      end,
    };
  }

  /**
   * Verifica se uma janela de tempo já passou
   *
   * @param window - Janela de tempo
   * @returns true se a janela já passou
   */
  static hasWindowPassed(window: TimeWindow): boolean {
    const now = new Date();
    return window.end < now;
  }

  /**
   * Verifica se uma janela de tempo está ativa agora
   *
   * @param window - Janela de tempo
   * @returns true se a janela está ativa
   */
  static isWindowActive(window: TimeWindow): boolean {
    const now = new Date();
    return this.isWithinTimeWindow(now, window);
  }
}
