/**
 * DateTime Utils
 *
 * Utilitários para manipulação de datas e horários.
 *
 * Fornece métodos para:
 * - Cálculo de horários estimados
 * - Formatação de intervalos de tempo
 * - Validação de janelas de tempo
 * - Parsing de horários planejados
 *
 * @module Common/Utils
 */

export class DateTimeUtils {
  /**
   * Calcula horário estimado de chegada
   */
  static calculateEstimatedArrival(startTime: Date, durationMinutes: number): Date {
    if (durationMinutes < 0) {
      throw new Error("Duração não pode ser negativa");
    }

    const arrivalTime = new Date(startTime.getTime() + durationMinutes * 60000);
    return arrivalTime;
  }

  /**
   * Formata intervalo de tempo no formato HH:mm - HH:mm
   */
  static formatTimeRange(start: string, end: string): string {
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
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map((s) => parseInt(s, 10));

    if (hours === undefined || minutes === undefined) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    return hours * 60 + minutes;
  }

  /**
   * Converte minutos para formato HH:mm
   */
  static minutesToTime(minutes: number): string {
    if (minutes < 0 || minutes >= 1440) {
      throw new Error(`Minutos inválidos: ${minutes}. Deve estar entre 0 e 1439`);
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  /**
   * Faz parsing de horário planejado
   */
  static parsePlannedTime(time: string): string {
    const timeParts = time.split(":");

    if (timeParts.length < 2 || !timeParts[0] || !timeParts[1]) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    if (hours < 0 || hours > 23) {
      throw new Error(`Horas inválidas: ${hours}. Deve estar entre 0 e 23`);
    }

    if (minutes < 0 || minutes > 59) {
      throw new Error(`Minutos inválidos: ${minutes}. Deve estar entre 0 e 59`);
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Verifica se string está no formato HH:mm válido
   */
  static isValidTimeFormat(time: string): boolean {
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return pattern.test(time);
  }

  /**
   * Calcula duração entre dois horários
   */
  static calculateDuration(start: string, end: string): number {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    let duration = endMinutes - startMinutes;

    if (duration < 0) {
      duration += 1440;
    }

    return duration;
  }

  /**
   * Adiciona minutos a um horário
   */
  static addMinutes(time: string, minutesToAdd: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutesToAdd;
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    return this.minutesToTime(normalizedMinutes);
  }

  /**
   * Combina data e horário em Date object
   */
  static combineDateAndTime(date: Date, time: string): Date {
    if (!this.isValidTimeFormat(time)) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    const [hours, minutes] = time.split(":").map((s) => parseInt(s, 10));

    if (hours === undefined || minutes === undefined) {
      throw new Error(`Formato de horário inválido: ${time}`);
    }

    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);

    return combined;
  }

  /**
   * Extrai horário HH:mm de um Date object
   */
  static extractTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Formata duração em minutos para string legível
   */
  static formatDuration(minutes: number): string {
    if (minutes < 0) {
      throw new Error("Duração não pode ser negativa");
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
   */
  static isInPast(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  /**
   * Verifica se data está no futuro
   */
  static isInFuture(date: Date): boolean {
    return date.getTime() > Date.now();
  }

  /**
   * Calcula diferença em dias entre duas datas
   */
  static daysDifference(date1: Date, date2: Date): number {
    const msPerDay = 86400000;
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffMs / msPerDay);
  }
}
