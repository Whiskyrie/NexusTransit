import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Interface para Route Entity no seed
 */
interface RouteEntity {
  id?: string;
  route_code: string;
  name: string;
  description?: string;
  vehicle_id: string;
  driver_id: string;
  status: string;
  type: string;
  route_date: Date;
  origin_address: string;
  origin_coordinates?: string;
  destination_address: string;
  destination_coordinates?: string;
  start_location?: string;
  end_location?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  total_distance?: number;
  total_duration?: number;
  optimization_score?: number;
  route_points?: object[];
  total_deliveries?: number;
  completed_deliveries?: number;
  failed_deliveries?: number;
}

/**
 * Interface para RouteStop Entity no seed
 */
interface RouteStopEntity {
  id?: string;
  route_id: string;
  sequence_order: number;
  address: string;
  coordinates?: string;
  status: string;
  planned_arrival_time?: string;
  estimated_duration_minutes?: number;
  notes?: string;
}

/**
 * Interface para Driver Entity no seed
 */
interface DriverEntity {
  id: string;
  full_name: string;
  status: string;
}

/**
 * Interface para Vehicle Entity no seed
 */
interface VehicleEntity {
  id: string;
  license_plate: string;
  status: string;
}

/**
 * Seed de rotas otimizadas de exemplo
 *
 * Cria rotas com paradas otimizadas para desenvolvimento e testes
 */
@Injectable()
export class RoutesSeed implements ISeed {
  private readonly logger = new Logger(RoutesSeed.name);

  constructor(
    @Inject("ROUTE_REPOSITORY")
    private readonly routeRepository: Repository<RouteEntity>,
    @Inject("ROUTE_STOP_REPOSITORY")
    private readonly routeStopRepository: Repository<RouteStopEntity>,
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: Repository<DriverEntity>,
    @Inject("VEHICLE_REPOSITORY")
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de rotas...");

    // Verificar se já existem rotas
    const count = await this.routeRepository.count();
    if (count > 0) {
      this.logger.log(`Já existem ${count} rotas no sistema. Pulando seed.`);
      return;
    }

    // Buscar motoristas e veículos disponíveis
    const drivers = await this.driverRepository.find({ take: 3 });
    const vehicles = await this.vehicleRepository.find({ take: 3 });

    if (drivers.length === 0) {
      this.logger.warn("Nenhum motorista encontrado. Execute o seed de motoristas primeiro.");
      return;
    }

    if (vehicles.length === 0) {
      this.logger.warn("Nenhum veículo encontrado. Execute o seed de veículos primeiro.");
      return;
    }

    // Dados de rotas de exemplo (São Paulo)
    const routesData = this.getRoutesData(drivers, vehicles);

    for (const routeData of routesData) {
      try {
        // Criar rota
        const route = this.routeRepository.create(routeData.route);
        const savedRoute = await this.routeRepository.save(route);

        this.logger.log(`Rota criada: ${savedRoute.route_code}`);

        // Criar paradas da rota
        for (const stopData of routeData.stops) {
          const stop = this.routeStopRepository.create({
            ...stopData,
            route_id: savedRoute.id!,
          });
          await this.routeStopRepository.save(stop);
        }

        this.logger.log(
          `${routeData.stops.length} paradas criadas para rota ${savedRoute.route_code}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao criar rota: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed de rotas concluído. ${routesData.length} rotas criadas.`);
  }

  private getRoutesData(
    drivers: DriverEntity[],
    vehicles: VehicleEntity[],
  ): { route: Partial<RouteEntity>; stops: Partial<RouteStopEntity>[] }[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      // Rota 1: Zona Sul de São Paulo - Otimizada
      {
        route: {
          route_code: `RT-${this.formatDate(today)}-001`,
          name: "Rota Zona Sul - Manhã",
          description: "Entregas na região da Zona Sul de São Paulo",
          vehicle_id: vehicles[0]?.id ?? "",
          driver_id: drivers[0]?.id ?? "",
          status: "PLANNED",
          type: "DELIVERY",
          route_date: today,
          origin_address: "Av. Paulista, 1000, São Paulo - SP",
          origin_coordinates: "POINT(-46.6558 -23.5632)",
          destination_address: "Av. Paulista, 1000, São Paulo - SP",
          destination_coordinates: "POINT(-46.6558 -23.5632)",
          start_location: "POINT(-46.6558 -23.5632)",
          end_location: "POINT(-46.6558 -23.5632)",
          planned_start_time: "08:00",
          planned_end_time: "12:00",
          total_distance: 35.5,
          total_duration: 180,
          optimization_score: 87.5,
          total_deliveries: 6,
          completed_deliveries: 0,
          failed_deliveries: 0,
          route_points: [
            { latitude: -23.5632, longitude: -46.6558, sequence: 0 },
            { latitude: -23.585, longitude: -46.64, sequence: 1 },
            { latitude: -23.598, longitude: -46.655, sequence: 2 },
            { latitude: -23.61, longitude: -46.67, sequence: 3 },
            { latitude: -23.625, longitude: -46.66, sequence: 4 },
            { latitude: -23.64, longitude: -46.645, sequence: 5 },
            { latitude: -23.65, longitude: -46.63, sequence: 6 },
          ],
        },
        stops: [
          {
            sequence_order: 1,
            address: "Rua Vergueiro, 1500, Vila Mariana, São Paulo - SP",
            coordinates: "POINT(-46.6400 -23.5850)",
            status: "PENDING",
            planned_arrival_time: "08:30",
            estimated_duration_minutes: 15,
            notes: "Entregar na portaria",
          },
          {
            sequence_order: 2,
            address: "Av. Jabaquara, 2000, Jabaquara, São Paulo - SP",
            coordinates: "POINT(-46.6550 -23.5980)",
            status: "PENDING",
            planned_arrival_time: "09:00",
            estimated_duration_minutes: 20,
            notes: "Cliente aguarda no térreo",
          },
          {
            sequence_order: 3,
            address: "Rua das Cerejeiras, 350, Santo Amaro, São Paulo - SP",
            coordinates: "POINT(-46.6700 -23.6100)",
            status: "PENDING",
            planned_arrival_time: "09:45",
            estimated_duration_minutes: 15,
          },
          {
            sequence_order: 4,
            address: "Av. João Dias, 800, Santo Amaro, São Paulo - SP",
            coordinates: "POINT(-46.6600 -23.6250)",
            status: "PENDING",
            planned_arrival_time: "10:15",
            estimated_duration_minutes: 10,
          },
          {
            sequence_order: 5,
            address: "Rua Socorro, 450, Socorro, São Paulo - SP",
            coordinates: "POINT(-46.6450 -23.6400)",
            status: "PENDING",
            planned_arrival_time: "10:45",
            estimated_duration_minutes: 15,
          },
          {
            sequence_order: 6,
            address: "Av. Interlagos, 3200, Interlagos, São Paulo - SP",
            coordinates: "POINT(-46.6300 -23.6500)",
            status: "PENDING",
            planned_arrival_time: "11:15",
            estimated_duration_minutes: 20,
            notes: "Ligar antes de chegar",
          },
        ],
      },

      // Rota 2: Zona Leste de São Paulo - Em progresso
      {
        route: {
          route_code: `RT-${this.formatDate(today)}-002`,
          name: "Rota Zona Leste - Tarde",
          description: "Entregas na região da Zona Leste de São Paulo",
          vehicle_id: vehicles[1]?.id ?? vehicles[0]?.id ?? "",
          driver_id: drivers[1]?.id ?? drivers[0]?.id ?? "",
          status: "IN_PROGRESS",
          type: "DELIVERY",
          route_date: today,
          origin_address: "Terminal Tietê, São Paulo - SP",
          origin_coordinates: "POINT(-46.6250 -23.5150)",
          destination_address: "Terminal Tietê, São Paulo - SP",
          destination_coordinates: "POINT(-46.6250 -23.5150)",
          start_location: "POINT(-46.6250 -23.5150)",
          end_location: "POINT(-46.6250 -23.5150)",
          planned_start_time: "13:00",
          planned_end_time: "18:00",
          total_distance: 42.8,
          total_duration: 240,
          optimization_score: 82.3,
          total_deliveries: 5,
          completed_deliveries: 2,
          failed_deliveries: 0,
          route_points: [
            { latitude: -23.515, longitude: -46.625, sequence: 0 },
            { latitude: -23.53, longitude: -46.58, sequence: 1 },
            { latitude: -23.545, longitude: -46.55, sequence: 2 },
            { latitude: -23.56, longitude: -46.52, sequence: 3 },
            { latitude: -23.575, longitude: -46.49, sequence: 4 },
            { latitude: -23.59, longitude: -46.46, sequence: 5 },
          ],
        },
        stops: [
          {
            sequence_order: 1,
            address: "Rua da Mooca, 2500, Mooca, São Paulo - SP",
            coordinates: "POINT(-46.5800 -23.5300)",
            status: "COMPLETED",
            planned_arrival_time: "13:30",
            estimated_duration_minutes: 15,
          },
          {
            sequence_order: 2,
            address: "Av. Sapopemba, 3500, Vila Prudente, São Paulo - SP",
            coordinates: "POINT(-46.5500 -23.5450)",
            status: "COMPLETED",
            planned_arrival_time: "14:15",
            estimated_duration_minutes: 20,
          },
          {
            sequence_order: 3,
            address: "Rua Serra de Bragança, 800, Tatuapé, São Paulo - SP",
            coordinates: "POINT(-46.5200 -23.5600)",
            status: "IN_TRANSIT",
            planned_arrival_time: "15:00",
            estimated_duration_minutes: 15,
          },
          {
            sequence_order: 4,
            address: "Av. Radial Leste, 4500, Penha, São Paulo - SP",
            coordinates: "POINT(-46.4900 -23.5750)",
            status: "PENDING",
            planned_arrival_time: "15:45",
            estimated_duration_minutes: 20,
          },
          {
            sequence_order: 5,
            address: "Rua Artur Malheiros, 200, São Mateus, São Paulo - SP",
            coordinates: "POINT(-46.4600 -23.5900)",
            status: "PENDING",
            planned_arrival_time: "16:30",
            estimated_duration_minutes: 25,
            notes: "Entrega com assinatura",
          },
        ],
      },

      // Rota 3: Zona Oeste de São Paulo - Planejada para amanhã
      {
        route: {
          route_code: `RT-${this.formatDate(tomorrow)}-001`,
          name: "Rota Zona Oeste - Manhã",
          description: "Entregas na região da Zona Oeste de São Paulo",
          vehicle_id: vehicles[2]?.id ?? vehicles[0]?.id ?? "",
          driver_id: drivers[2]?.id ?? drivers[0]?.id ?? "",
          status: "PLANNED",
          type: "DELIVERY",
          route_date: tomorrow,
          origin_address: "Av. Brigadeiro Faria Lima, 3000, São Paulo - SP",
          origin_coordinates: "POINT(-46.6800 -23.5850)",
          destination_address: "Av. Brigadeiro Faria Lima, 3000, São Paulo - SP",
          destination_coordinates: "POINT(-46.6800 -23.5850)",
          start_location: "POINT(-46.6800 -23.5850)",
          end_location: "POINT(-46.6800 -23.5850)",
          planned_start_time: "07:30",
          planned_end_time: "11:30",
          total_distance: 28.3,
          total_duration: 150,
          optimization_score: 91.2,
          total_deliveries: 4,
          completed_deliveries: 0,
          failed_deliveries: 0,
          route_points: [
            { latitude: -23.585, longitude: -46.68, sequence: 0 },
            { latitude: -23.57, longitude: -46.7, sequence: 1 },
            { latitude: -23.555, longitude: -46.72, sequence: 2 },
            { latitude: -23.54, longitude: -46.74, sequence: 3 },
            { latitude: -23.525, longitude: -46.76, sequence: 4 },
          ],
        },
        stops: [
          {
            sequence_order: 1,
            address: "Rua Oscar Freire, 500, Pinheiros, São Paulo - SP",
            coordinates: "POINT(-46.7000 -23.5700)",
            status: "PENDING",
            planned_arrival_time: "08:00",
            estimated_duration_minutes: 15,
          },
          {
            sequence_order: 2,
            address: "Av. Rebouças, 2000, Pinheiros, São Paulo - SP",
            coordinates: "POINT(-46.7200 -23.5550)",
            status: "PENDING",
            planned_arrival_time: "08:45",
            estimated_duration_minutes: 20,
          },
          {
            sequence_order: 3,
            address: "Rua dos Pinheiros, 1200, Pinheiros, São Paulo - SP",
            coordinates: "POINT(-46.7400 -23.5400)",
            status: "PENDING",
            planned_arrival_time: "09:30",
            estimated_duration_minutes: 15,
          },
          {
            sequence_order: 4,
            address: "Av. Vital Brasil, 800, Butantã, São Paulo - SP",
            coordinates: "POINT(-46.7600 -23.5250)",
            status: "PENDING",
            planned_arrival_time: "10:15",
            estimated_duration_minutes: 20,
            notes: "Entrar pela USP",
          },
        ],
      },
    ];
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
}
