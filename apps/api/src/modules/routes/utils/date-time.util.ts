/**
 * DateTime Utils
 *
 * Utilitários para manipulação de datas e horários de rotas.
 *
 * Fornece métodos para:
 * - Cálculo de horários estimados
 * - Formatação de intervalos de tempo
 * - Validação de janelas de tempo
 * - Parsing de horários planejados
 *
 * @module Routes/Utils
 */

/**
 * Classe utilitária para data e hora
 */
export class DateTimeUtils {
  /**
   * Calcula horário estimado de chegada
   *
   * @param startTime - Horário de início
   * @param durationMinutes - Duração em minutos
   * @returns Data/hora estimada de chegada
   *
   * @example
   * ```typescript
   * const start = new Date('2024-01-15T08:00:00');
   * const arrival = DateTimeUtils.calculateEstimatedArrival(start, 120);
   * // 2024-01-15T10:00:00
   * ```
   */
  static calculateEstimatedArrival(startTime: Date, durationMinutes: number): Date {
    if (durationMinutes < 0) {
      throw new Error('Duração não pode ser negativa');
    }

    const arrivalTime = new Date(startTime.getTime() + durationMinutes * 60000);
    return arrivalTime;
  }

  /**
   * Formata intervalo de tempo no formato HH:mm - HH:mm
   *
   * @param start - Horário de início (formato HH:mm)
   * @param end - Horário de término (formato HH:mm)
   * @returns String formatada
   *
   * @example
   * ```typescript
   * DateTimeUtils.formatTimeRange('08:00', '17:30');
   * // "08:00 - 17:30"
   * ```
   */
  static formatTimeRange(start: string, end: string): string {
    // Validar formato
    if (!this.isValidTimeFormat(start)) {
      throw new Error(`Formato de horário inválido: ${start}`);
    }
    if (!this.isValidTimeFormat(end)) {
      throw new Error(`Formato de horário inválido: ${end}`);
    }

    return `${start} - ${end}`;
  }

  /**
   * Valida janela de tempo
   *
   * Verifica se horário de término é posterior ao de início
   *
   * @param plannedStart - Horário de início (HH:mm)
   * @param plannedEnd - Horário de término (HH:mm)
   * @returns true se válido
   *
   * @example
   * ```typescript
   * DateTimeUtils.validateTimeWindow('08:00', '17:00'); // true
   * DateTimeUtils.validateTimeWindow('17:00', '08:00'); // false
   * ```
   */
  static validateTimeWindow(plannedStart: string, plannedEnd: string): boolean {
    if (!this.isValidTimeFormat(plannedStart) || !this.isValidTimeFormat(plannedEnd)) {
      return false;
    }

    const startMinutes = this.timeToMinutes(plannedStart);
    const endMinutes = this.timeToMinutes(plannedEnd);

    return endMinutes > startMinutes;
  }

  /**
   * Converte horário HH:mm para minutos desde meia-noite
   *
   * @param time - Horário no formato HH:mm
   * @returns Minutos desde 00:00
   *
   * @example
   * ```typescript
   * DateTimeUtils.timeToMinutes('08:30'); // 510 (8*60 + 30)
   * DateTimeUtils.timeToMinutes('14:45'); // 885 (14*60 + 45)
   * ```
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(s => parseInt(s, 10));

    if (hours === undefined || minutes === undefined) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    return hours * 60 + minutes;
  }

  /**
   * Converte minutos para formato HH:mm
   *
   * @param minutes - Minutos desde meia-noite
   * @returns Horário formatado HH:mm
   *
   * @example
   * ```typescript
   * DateTimeUtils.minutesToTime(510); // "08:30"
   * DateTimeUtils.minutesToTime(885); // "14:45"
   * ```
   */
  static minutesToTime(minutes: number): string {
    if (minutes < 0 || minutes >= 1440) {
      throw new Error(`Minutos inválidos: ${minutes}. Deve estar entre 0 e 1439`);
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Faz parsing de horário planejado
   *
   * Aceita vários formatos e normaliza para HH:mm
   *
   * @param time - Horário em diversos formatos
   * @returns Horário normalizado HH:mm
   *
   * @example
   * ```typescript
   * DateTimeUtils.parsePlannedTime('8:30'); // "08:30"
   * DateTimeUtils.parsePlannedTime('14:5'); // "14:05"
   * DateTimeUtils.parsePlannedTime('08:30:00'); // "08:30"
   * ```
   */
  static parsePlannedTime(time: string): string {
    // Remover segundos se presentes
    const timeParts = time.split(':');

    if (timeParts.length < 2 || !timeParts[0] || !timeParts[1]) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    // Validar ranges
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    if (hours < 0 || hours > 23) {
      throw new Error(`Horas inválidas: ${hours}. Deve estar entre 0 e 23`);
    }

    if (minutes < 0 || minutes > 59) {
      throw new Error(`Minutos inválidos: ${minutes}. Deve estar entre 0 e 59`);
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Verifica se string está no formato HH:mm válido
   *
   * @param time - String para validar
   * @returns true se válido
   *
   * @example
   * ```typescript
   * DateTimeUtils.isValidTimeFormat('08:30'); // true
   * DateTimeUtils.isValidTimeFormat('25:00'); // false
   * DateTimeUtils.isValidTimeFormat('08:30:00'); // false
   * ```
   */
  static isValidTimeFormat(time: string): boolean {
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return pattern.test(time);
  }

  /**
   * Calcula duração entre dois horários
   *
   * @param start - Horário de início (HH:mm)
   * @param end - Horário de término (HH:mm)
   * @returns Duração em minutos
   *
   * @example
   * ```typescript
   * DateTimeUtils.calculateDuration('08:00', '17:30'); // 570 minutos (9h30min)
   * ```
   */
  static calculateDuration(start: string, end: string): number {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    let duration = endMinutes - startMinutes;

    // Se fim é antes do início, assumir que cruza meia-noite
    if (duration < 0) {
      duration += 1440; // 24 horas
    }

    return duration;
  }

  /**
   * Adiciona minutos a um horário
   *
   * @param time - Horário base (HH:mm)
   * @param minutesToAdd - Minutos para adicionar
   * @returns Novo horário (HH:mm)
   *
   * @example
   * ```typescript
   * DateTimeUtils.addMinutes('08:30', 90); // "10:00"
   * DateTimeUtils.addMinutes('23:30', 60); // "00:30" (próximo dia)
   * ```
   */
  static addMinutes(time: string, minutesToAdd: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutesToAdd;
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440; // Normalizar para 0-1439
    return this.minutesToTime(normalizedMinutes);
  }

  /**
   * Combina data e horário em Date object
   *
   * @param date - Data base
   * @param time - Horário HH:mm
   * @returns Date object combinado
   *
   * @example
   * ```typescript
   * const date = new Date('2024-01-15');
   * const dateTime = DateTimeUtils.combineDateAndTime(date, '08:30');
   * // 2024-01-15T08:30:00
   * ```
   */
  static combineDateAndTime(date: Date, time: string): Date {
    if (!this.isValidTimeFormat(time)) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    const [hours, minutes] = time.split(':').map(s => parseInt(s, 10));

    if (hours === undefined || minutes === undefined) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);

    return combined;
  }

  /**
   * Extrai horário HH:mm de um Date object
   *
   * @param date - Date object
   * @returns Horário no formato HH:mm
   *
   * @example
   * ```typescript
   * const date = new Date('2024-01-15T08:30:00');
   * DateTimeUtils.extractTime(date); // "08:30"
   * ```
   */
  static extractTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Formata duração em minutos para string legível
   *
   * @param minutes - Duração em minutos
   * @returns String formatada (ex: "2h 30min")
   *
   * @example
   * ```typescript
   * DateTimeUtils.formatDuration(150); // "2h 30min"
   * DateTimeUtils.formatDuration(45); // "45min"
   * DateTimeUtils.formatDuration(60); // "1h"
   * ```
   */
  static formatDuration(minutes: number): string {
    if (minutes < 0) {
      throw new Error('Duração não pode ser negativa');
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}min`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}min`;
  }

  /**
   * Verifica se data está no passado
   *
   * @param date - Data para verificar
   * @returns true se no passado
   *
   * @example
   * ```typescript
   * const yesterday = new Date(Date.now() - 86400000);
   * DateTimeUtils.isInPast(yesterday); // true
   * ```
   */
  static isInPast(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  /**
   * Verifica se data está no futuro
   *
   * @param date - Data para verificar
   * @returns true se no futuro
   */
  static isInFuture(date: Date): boolean {
    return date.getTime() > Date.now();
  }

  /**
   * Calcula diferença em dias entre duas datas
   *
   * @param date1 - Primeira data
   * @param date2 - Segunda data
   * @returns Diferença em dias (absoluta)
   *
   * @example
   * ```typescript
   * const date1 = new Date('2024-01-15');
   * const date2 = new Date('2024-01-20');
   * DateTimeUtils.daysDifference(date1, date2); // 5
   * ```
   */
  static daysDifference(date1: Date, date2: Date): number {
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffMs / msPerDay);
  }
}
