import { DateTimeUtils } from "./date-time.util";

describe("DateTimeUtils", () => {
  describe("calculateEstimatedArrival", () => {
    it("deve calcular horário de chegada estimado corretamente", () => {
      const startTime = new Date("2025-01-15T10:00:00");
      const durationMinutes = 120; // 2 horas

      const arrival = DateTimeUtils.calculateEstimatedArrival(startTime, durationMinutes);

      expect(arrival.getHours()).toBe(12);
      expect(arrival.getMinutes()).toBe(0);
    });

    it("deve lançar erro para duração negativa", () => {
      const startTime = new Date("2025-01-15T10:00:00");

      expect(() => DateTimeUtils.calculateEstimatedArrival(startTime, -30)).toThrow(
        "Duração não pode ser negativa",
      );
    });

    it("deve calcular corretamente para duração 0", () => {
      const startTime = new Date("2025-01-15T10:00:00");

      const arrival = DateTimeUtils.calculateEstimatedArrival(startTime, 0);

      expect(arrival.getTime()).toBe(startTime.getTime());
    });
  });

  describe("formatTimeRange", () => {
    it("deve formatar intervalo de tempo corretamente", () => {
      const result = DateTimeUtils.formatTimeRange("08:00", "17:00");

      expect(result).toBe("08:00 - 17:00");
    });

    it("deve lançar erro para horário inicial inválido", () => {
      expect(() => DateTimeUtils.formatTimeRange("25:00", "17:00")).toThrow(
        "Formato de horário inválido",
      );
    });

    it("deve lançar erro para horário final inválido", () => {
      expect(() => DateTimeUtils.formatTimeRange("08:00", "invalid")).toThrow(
        "Formato de horário inválido",
      );
    });
  });

  describe("validateTimeWindow", () => {
    it("deve retornar true para janela válida", () => {
      expect(DateTimeUtils.validateTimeWindow("08:00", "17:00")).toBe(true);
      expect(DateTimeUtils.validateTimeWindow("00:00", "23:59")).toBe(true);
    });

    it("deve retornar false para janela inválida (fim antes do início)", () => {
      expect(DateTimeUtils.validateTimeWindow("17:00", "08:00")).toBe(false);
    });

    it("deve retornar false para horários iguais", () => {
      expect(DateTimeUtils.validateTimeWindow("10:00", "10:00")).toBe(false);
    });

    it("deve retornar false para formato inválido", () => {
      expect(DateTimeUtils.validateTimeWindow("invalid", "17:00")).toBe(false);
      expect(DateTimeUtils.validateTimeWindow("08:00", "25:00")).toBe(false);
    });
  });

  describe("timeToMinutes", () => {
    it("deve converter horário para minutos corretamente", () => {
      expect(DateTimeUtils.timeToMinutes("00:00")).toBe(0);
      expect(DateTimeUtils.timeToMinutes("01:00")).toBe(60);
      expect(DateTimeUtils.timeToMinutes("12:30")).toBe(750);
      expect(DateTimeUtils.timeToMinutes("23:59")).toBe(1439);
    });

    it("deve lançar erro para formato inválido", () => {
      expect(() => DateTimeUtils.timeToMinutes("invalid")).toThrow("Formato de horário inválido");
      expect(() => DateTimeUtils.timeToMinutes("")).toThrow("Formato de horário inválido");
    });
  });

  describe("minutesToTime", () => {
    it("deve converter minutos para horário corretamente", () => {
      expect(DateTimeUtils.minutesToTime(0)).toBe("00:00");
      expect(DateTimeUtils.minutesToTime(60)).toBe("01:00");
      expect(DateTimeUtils.minutesToTime(750)).toBe("12:30");
      expect(DateTimeUtils.minutesToTime(1439)).toBe("23:59");
    });

    it("deve lançar erro para minutos negativos", () => {
      expect(() => DateTimeUtils.minutesToTime(-1)).toThrow(
        "Minutos inválidos: -1. Deve estar entre 0 e 1439",
      );
    });

    it("deve lançar erro para minutos >= 1440", () => {
      expect(() => DateTimeUtils.minutesToTime(1440)).toThrow("Minutos inválidos");
      expect(() => DateTimeUtils.minutesToTime(2000)).toThrow("Minutos inválidos");
    });

    it("deve formatar com zero à esquerda", () => {
      expect(DateTimeUtils.minutesToTime(65)).toBe("01:05");
      expect(DateTimeUtils.minutesToTime(9)).toBe("00:09");
    });
  });

  describe("parsePlannedTime", () => {
    it("deve fazer parse de horário válido", () => {
      expect(DateTimeUtils.parsePlannedTime("08:30")).toBe("08:30");
      expect(DateTimeUtils.parsePlannedTime("00:00")).toBe("00:00");
      expect(DateTimeUtils.parsePlannedTime("23:59")).toBe("23:59");
    });

    it("deve lançar erro para formato inválido", () => {
      expect(() => DateTimeUtils.parsePlannedTime("invalid")).toThrow(
        "Formato de horário inválido",
      );
      // "8:30" é aceito pois tem 2 partes separadas por ":"
    });

    it("deve lançar erro para horas inválidas", () => {
      expect(() => DateTimeUtils.parsePlannedTime("25:00")).toThrow("Horas inválidas");
      expect(() => DateTimeUtils.parsePlannedTime("-01:00")).toThrow("Horas inválidas");
    });

    it("deve lançar erro para minutos inválidos", () => {
      expect(() => DateTimeUtils.parsePlannedTime("10:60")).toThrow("Minutos inválidos");
      expect(() => DateTimeUtils.parsePlannedTime("10:-01")).toThrow("Minutos inválidos");
    });
  });

  describe("isValidTimeFormat", () => {
    it("deve retornar true para formatos válidos", () => {
      expect(DateTimeUtils.isValidTimeFormat("00:00")).toBe(true);
      expect(DateTimeUtils.isValidTimeFormat("12:30")).toBe(true);
      expect(DateTimeUtils.isValidTimeFormat("23:59")).toBe(true);
    });

    it("deve retornar false para formatos inválidos", () => {
      expect(DateTimeUtils.isValidTimeFormat("24:00")).toBe(false);
      expect(DateTimeUtils.isValidTimeFormat("12:60")).toBe(false);
      expect(DateTimeUtils.isValidTimeFormat("8:30")).toBe(false);
      expect(DateTimeUtils.isValidTimeFormat("invalid")).toBe(false);
      expect(DateTimeUtils.isValidTimeFormat("")).toBe(false);
    });
  });

  describe("calculateDuration", () => {
    it("deve calcular duração entre horários no mesmo dia", () => {
      expect(DateTimeUtils.calculateDuration("08:00", "17:00")).toBe(540); // 9 horas
      expect(DateTimeUtils.calculateDuration("00:00", "12:00")).toBe(720); // 12 horas
    });

    it("deve calcular duração que cruza meia-noite", () => {
      expect(DateTimeUtils.calculateDuration("23:00", "01:00")).toBe(120); // 2 horas
      expect(DateTimeUtils.calculateDuration("22:00", "02:00")).toBe(240); // 4 horas
    });

    it("deve retornar 0 para horários iguais", () => {
      expect(DateTimeUtils.calculateDuration("10:00", "10:00")).toBe(0);
    });
  });

  describe("addMinutes", () => {
    it("deve adicionar minutos corretamente", () => {
      expect(DateTimeUtils.addMinutes("08:00", 30)).toBe("08:30");
      expect(DateTimeUtils.addMinutes("10:00", 120)).toBe("12:00");
    });

    it("deve lidar com overflow de dia", () => {
      expect(DateTimeUtils.addMinutes("23:30", 60)).toBe("00:30");
      expect(DateTimeUtils.addMinutes("23:00", 90)).toBe("00:30");
    });

    it("deve lidar com minutos negativos", () => {
      expect(DateTimeUtils.addMinutes("10:00", -30)).toBe("09:30");
      expect(DateTimeUtils.addMinutes("00:30", -60)).toBe("23:30");
    });
  });

  describe("combineDateAndTime", () => {
    it("deve combinar data e horário corretamente", () => {
      const date = new Date("2025-01-15T00:00:00Z");
      const result = DateTimeUtils.combineDateAndTime(date, "14:30");

      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("deve lançar erro para formato de horário inválido", () => {
      const date = new Date("2025-01-15");

      expect(() => DateTimeUtils.combineDateAndTime(date, "invalid")).toThrow(
        "Formato de horário inválido",
      );
    });
  });

  describe("extractTime", () => {
    it("deve extrair horário de Date object", () => {
      const date = new Date("2025-01-15T14:30:45");
      const time = DateTimeUtils.extractTime(date);

      expect(time).toBe("14:30");
    });

    it("deve formatar com zero à esquerda", () => {
      const date = new Date("2025-01-15T09:05:00");
      const time = DateTimeUtils.extractTime(date);

      expect(time).toBe("09:05");
    });
  });

  describe("formatDuration", () => {
    it("deve formatar apenas minutos", () => {
      expect(DateTimeUtils.formatDuration(30)).toBe("30min");
      expect(DateTimeUtils.formatDuration(45)).toBe("45min");
    });

    it("deve formatar apenas horas", () => {
      expect(DateTimeUtils.formatDuration(60)).toBe("1h");
      expect(DateTimeUtils.formatDuration(120)).toBe("2h");
    });

    it("deve formatar horas e minutos", () => {
      expect(DateTimeUtils.formatDuration(90)).toBe("1h 30min");
      expect(DateTimeUtils.formatDuration(195)).toBe("3h 15min");
    });

    it("deve lançar erro para duração negativa", () => {
      expect(() => DateTimeUtils.formatDuration(-10)).toThrow("Duração não pode ser negativa");
    });

    it("deve formatar 0 minutos", () => {
      expect(DateTimeUtils.formatDuration(0)).toBe("0min");
    });
  });

  describe("isInPast", () => {
    it("deve retornar true para data no passado", () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(DateTimeUtils.isInPast(pastDate)).toBe(true);
    });

    it("deve retornar false para data no futuro", () => {
      const futureDate = new Date(Date.now() + 1000);
      expect(DateTimeUtils.isInPast(futureDate)).toBe(false);
    });
  });

  describe("isInFuture", () => {
    it("deve retornar true para data no futuro", () => {
      const futureDate = new Date(Date.now() + 1000);
      expect(DateTimeUtils.isInFuture(futureDate)).toBe(true);
    });

    it("deve retornar false para data no passado", () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(DateTimeUtils.isInFuture(pastDate)).toBe(false);
    });
  });

  describe("daysDifference", () => {
    it("deve calcular diferença em dias corretamente", () => {
      const date1 = new Date("2025-01-15");
      const date2 = new Date("2025-01-20");

      expect(DateTimeUtils.daysDifference(date1, date2)).toBe(5);
    });

    it("deve retornar valor absoluto", () => {
      const date1 = new Date("2025-01-20");
      const date2 = new Date("2025-01-15");

      expect(DateTimeUtils.daysDifference(date1, date2)).toBe(5);
    });

    it("deve retornar 0 para mesma data", () => {
      const date = new Date("2025-01-15");

      expect(DateTimeUtils.daysDifference(date, date)).toBe(0);
    });
  });
});
