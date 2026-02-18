import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Interface para Vehicle Entity no seed
 */
export interface VehicleEntity {
  id?: string;
  license_plate: string;
  license_plate_type?: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  chassis_number?: string;
  renavam?: string;
  vehicle_type: string;
  status: string;
  fuel_type?: string;
  load_capacity?: number;
  cargo_volume?: number;
  acquisition_date?: Date;
  last_maintenance_at?: Date;
  next_maintenance_at?: Date;
  mileage?: number;
  has_gps?: boolean;
  has_refrigeration?: boolean;
}

/**
 * Seed de veículos de exemplo
 *
 * Cria veículos para desenvolvimento e testes
 */
@Injectable()
export class VehiclesSeed implements ISeed {
  private readonly logger = new Logger(VehiclesSeed.name);

  constructor(
    @Inject("VEHICLE_REPOSITORY")
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de veículos...");

    // Verificar se já existem veículos suficientes
    const count = await this.vehicleRepository.count();
    if (count >= 40) {
      this.logger.log(`Já existem ${count} veículos no sistema. Pulando seed.`);
      return;
    }

    this.logger.log(`Existem ${count} veículos. Criando mais veículos...`);

    const vehiclesData = this.getVehiclesData();
    // Adicionar veículos gerados dinamicamente
    const additionalVehicles = this.generateAdditionalVehicles(40 - 18); // 18 é o número de veículos base
    vehiclesData.push(...additionalVehicles);

    for (const vehicleData of vehiclesData) {
      try {
        const vehicle = this.vehicleRepository.create(vehicleData);
        const savedVehicle = await this.vehicleRepository.save(vehicle);
        this.logger.log(`Veículo criado: ${savedVehicle.license_plate} - ${savedVehicle.model}`);
      } catch (error) {
        this.logger.error(
          `Erro ao criar veículo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed de veículos concluído. ${vehiclesData.length} veículos criados.`);
  }

  private getVehiclesData(): Partial<VehicleEntity>[] {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return [
      {
        license_plate: "ABC1D23",
        license_plate_type: "mercosul",
        brand: "Ford",
        model: "Cargo 1719",
        year: 2020,
        color: "Branco",
        chassis_number: "9BFXZ4JA5C123456",
        renavam: "12345678901",
        vehicle_type: "truck",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 8500,
        cargo_volume: 32,
        acquisition_date: new Date("2020-01-15"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 85000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "DEF2E34",
        license_plate_type: "mercosul",
        brand: "Mercedes-Benz",
        model: "Sprinter 515",
        year: 2021,
        color: "Prata",
        chassis_number: "8AB1XW2H7L234567",
        renavam: "23456789012",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1550,
        cargo_volume: 14,
        acquisition_date: new Date("2021-03-20"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 62000,
        has_gps: true,
        has_refrigeration: true,
      },
      {
        license_plate: "GHI3F45",
        license_plate_type: "mercosul",
        brand: "Volkswagen",
        model: "Delivery Express",
        year: 2022,
        color: "Branco",
        chassis_number: "9BWDB11X8M345678",
        renavam: "34567890123",
        vehicle_type: "truck",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 5000,
        cargo_volume: 18,
        acquisition_date: new Date("2022-06-10"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 38000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "JKL4G56",
        license_plate_type: "mercosul",
        brand: "Iveco",
        model: "Daily 35S14",
        year: 2021,
        color: "Vermelho",
        chassis_number: "93ZZ4APD9N456789",
        renavam: "45678901234",
        vehicle_type: "van",
        status: "maintenance",
        fuel_type: "diesel",
        load_capacity: 3500,
        cargo_volume: 12,
        acquisition_date: new Date("2021-09-05"),
        last_maintenance_at: today,
        next_maintenance_at: nextMonth,
        mileage: 54000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "MNO5H67",
        license_plate_type: "mercosul",
        brand: "Fiat",
        model: "Ducato Cargo",
        year: 2023,
        color: "Branco",
        chassis_number: "ZFA25000O567890",
        renavam: "56789012345",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1300,
        cargo_volume: 10,
        acquisition_date: new Date("2023-02-14"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 18000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "PQR6I78",
        license_plate_type: "mercosul",
        brand: "Renault",
        model: "Master L3H2",
        year: 2022,
        color: "Prata",
        chassis_number: "VF1MA000P678901",
        renavam: "67890123456",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1500,
        cargo_volume: 13,
        acquisition_date: new Date("2022-11-22"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 29000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "STU7J89",
        license_plate_type: "mercosul",
        brand: "Ford",
        model: "Transit Van",
        year: 2023,
        color: "Azul",
        chassis_number: "9BFXZ5KD9P789012",
        renavam: "78901234567",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1400,
        cargo_volume: 11,
        acquisition_date: new Date("2023-04-08"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 15000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "VWX8K90",
        license_plate_type: "mercosul",
        brand: "Mercedes-Benz",
        model: "Accelo 1016",
        year: 2021,
        color: "Branco",
        chassis_number: "8AB2YZ3I8Q890123",
        renavam: "89012345678",
        vehicle_type: "truck",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 4500,
        cargo_volume: 16,
        acquisition_date: new Date("2021-07-19"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 71000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "YZA9L01",
        license_plate_type: "mercosul",
        brand: "Volkswagen",
        model: "Constellation 17.280",
        year: 2020,
        color: "Branco",
        chassis_number: "9BWEB22X9R901234",
        renavam: "90123456789",
        vehicle_type: "truck",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 11000,
        cargo_volume: 45,
        acquisition_date: new Date("2020-10-12"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 92000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "BCD0M12",
        license_plate_type: "mercosul",
        brand: "Hyundai",
        model: "HR 2.5 TCI",
        year: 2022,
        color: "Cinza",
        chassis_number: "95VPA412S012345",
        renavam: "01234567890",
        vehicle_type: "truck",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 3000,
        cargo_volume: 14,
        acquisition_date: new Date("2022-02-28"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 44000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "EFG1N23",
        license_plate_type: "mercosul",
        brand: "Peugeot",
        model: "Boxer L3H2",
        year: 2023,
        color: "Branco",
        chassis_number: "VF3YB00UT123456",
        renavam: "12345678902",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1500,
        cargo_volume: 13,
        acquisition_date: new Date("2023-05-17"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 12000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "HIJ2O34",
        license_plate_type: "mercosul",
        brand: "Ford",
        model: "Cargo 816",
        year: 2021,
        color: "Vermelho",
        chassis_number: "9BFXZ6LE0V234567",
        renavam: "23456789013",
        vehicle_type: "truck",
        status: "maintenance",
        fuel_type: "diesel",
        load_capacity: 3200,
        cargo_volume: 15,
        acquisition_date: new Date("2021-12-03"),
        last_maintenance_at: today,
        next_maintenance_at: nextMonth,
        mileage: 67000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "KLM3P45",
        license_plate_type: "mercosul",
        brand: "Iveco",
        model: "Tector 11-190",
        year: 2020,
        color: "Branco",
        chassis_number: "93ZZ5BQE1W345678",
        renavam: "34567890124",
        vehicle_type: "truck",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 6800,
        cargo_volume: 28,
        acquisition_date: new Date("2020-08-25"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 103000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "NOP4Q56",
        license_plate_type: "mercosul",
        brand: "Mercedes-Benz",
        model: "Sprinter 416",
        year: 2022,
        color: "Branco",
        chassis_number: "8AB3ZX4J2X456789",
        renavam: "45678901235",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1600,
        cargo_volume: 14,
        acquisition_date: new Date("2022-09-14"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 35000,
        has_gps: true,
        has_refrigeration: false,
      },
      {
        license_plate: "QRS5R67",
        license_plate_type: "mercosul",
        brand: "Fiat",
        model: "Toro Endurance Diesel",
        year: 2023,
        color: "Preto",
        chassis_number: "ZFA59000Y567890",
        renavam: "56789012346",
        vehicle_type: "car",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1000,
        cargo_volume: 4,
        acquisition_date: new Date("2023-01-20"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 21000,
        has_gps: false,
        has_refrigeration: false,
      },
      {
        license_plate: "TUV6S78",
        license_plate_type: "mercosul",
        brand: "Volkswagen",
        model: "Saveiro Robust CS",
        year: 2022,
        color: "Branco",
        chassis_number: "9BWFB05W9Z678901",
        renavam: "67890123457",
        vehicle_type: "car",
        status: "active",
        fuel_type: "hybrid",
        load_capacity: 735,
        cargo_volume: 3,
        acquisition_date: new Date("2022-05-09"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 47000,
        has_gps: false,
        has_refrigeration: false,
      },
      {
        license_plate: "WXY7T89",
        license_plate_type: "mercosul",
        brand: "Renault",
        model: "Master Chassi",
        year: 2021,
        color: "Branco",
        chassis_number: "VF1MB001A789012",
        renavam: "78901234568",
        vehicle_type: "van",
        status: "active",
        fuel_type: "diesel",
        load_capacity: 1800,
        cargo_volume: 15,
        acquisition_date: new Date("2021-11-30"),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 58000,
        has_gps: true,
        has_refrigeration: false,
      },
    ];
  }

  /**
   * Gera veículos adicionais dinamicamente
   */
  private generateAdditionalVehicles(count: number): Partial<VehicleEntity>[] {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const vehicleModels = [
      { brand: "Mercedes-Benz", model: "Sprinter 415", type: "van", capacity: 1500, volume: 12 },
      { brand: "Ford", model: "Transit", type: "van", capacity: 1400, volume: 11 },
      { brand: "Fiat", model: "Ducato Cargo", type: "van", capacity: 1600, volume: 13 },
      { brand: "Iveco", model: "Daily 35S14", type: "van", capacity: 1800, volume: 14 },
      { brand: "Volkswagen", model: "Delivery 9.170", type: "truck", capacity: 5500, volume: 25 },
      { brand: "Ford", model: "Cargo 816", type: "truck", capacity: 4500, volume: 20 },
      { brand: "Mercedes-Benz", model: "Accelo 815", type: "truck", capacity: 4800, volume: 22 },
      { brand: "Hyundai", model: "HR", type: "van", capacity: 1200, volume: 8 },
      { brand: "Kia", model: "Bongo K2500", type: "van", capacity: 1300, volume: 9 },
      { brand: "Renault", model: "Master L3H2", type: "van", capacity: 1700, volume: 14 },
    ];
    const colors = ["Branco", "Prata", "Preto", "Azul", "Vermelho", "Cinza"];
    const fuelTypes = ["diesel", "diesel", "gasoline", "hybrid"];
    const statuses = ["active", "active", "active", "maintenance"];
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const vehicles: Partial<VehicleEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const vehicleInfo = vehicleModels[i % vehicleModels.length];
      const letter1 = letters[i % letters.length];
      const letter2 = letters[(i + 3) % letters.length];
      const letter3 = letters[(i + 7) % letters.length];
      const num = String(1000 + i).slice(1);
      const plate = `${letter1}${letter2}${letter3}${i % 10}${letter1}${num.slice(0, 2)}`;

      vehicles.push({
        license_plate: plate,
        license_plate_type: "mercosul",
        brand: vehicleInfo.brand,
        model: vehicleInfo.model,
        year: 2019 + (i % 5),
        color: colors[i % colors.length],
        chassis_number: `9BW${String(i).padStart(5, "0")}${String(Math.random()).slice(2, 10)}`,
        renavam: String(10000000000 + i * 123456).slice(0, 11),
        vehicle_type: vehicleInfo.type,
        status: statuses[i % statuses.length],
        fuel_type: fuelTypes[i % fuelTypes.length],
        load_capacity: vehicleInfo.capacity,
        cargo_volume: vehicleInfo.volume,
        acquisition_date: new Date(2019 + (i % 5), i % 12, (i % 28) + 1),
        last_maintenance_at: sixMonthsAgo,
        next_maintenance_at: nextMonth,
        mileage: 30000 + i * 5000,
        has_gps: i % 3 !== 0,
        has_refrigeration: i % 5 === 0,
      });
    }

    return vehicles;
  }
}
