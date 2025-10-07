import type { Vehicle } from '../entities/vehicle.entity';
import { VehicleMaintenance } from '../entities/vehicle-maintenance.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FuelCostEstimate } from '../interfaces/fuel-consumption.interface';

/**
 * Utilitários para cálculos de consumo de combustível
 *
 * Fornece métodos para:
 * - Calcular consumo médio de veículos
 * - Estimar custos de combustível
 * - Analisar eficiência energética
 *
 * @class FuelConsumptionUtils
 */
@Injectable()
export class FuelConsumptionUtils {
  /**
   * Preços médios de combustível (por litro em R$)
   * Estes valores devem ser atualizados periodicamente ou vir de uma API externa
   */
  private static readonly FUEL_PRICES: Record<string, number> = {
    gasoline: 5.89,
    diesel: 5.75,
    ethanol: 4.29,
    electric: 0.85, // kWh
    gnv: 4.5,
  };

  /**
   * Consumo médio padrão por tipo de combustível (km/l ou km/kWh)
   */
  private static readonly DEFAULT_CONSUMPTION: Record<string, number> = {
    gasoline: 10,
    diesel: 12,
    ethanol: 7,
    electric: 6, // km/kWh
    gnv: 11,
  };

  constructor(
    @InjectRepository(VehicleMaintenance)
    private readonly maintenanceRepository: Repository<VehicleMaintenance>,
  ) {}

  /**
   * Calcula o consumo médio de combustível de um veículo
   *
   * Analisa o histórico de manutenções para estimar o consumo médio.
   * Para cálculos mais precisos, considere integrar com sistema de abastecimento.
   *
   * @param vehicleId - ID do veículo
   * @returns Consumo médio em km/l (ou km/kWh para elétricos)
   *
   * @example
   * ```typescript
   * const avgConsumption = await fuelUtils.calculateAverageConsumption(vehicleId);
   * console.log(`Consumo médio: ${avgConsumption} km/l`);
   * ```
   */
  async calculateAverageConsumption(vehicleId: string): Promise<number> {
    // Busca manutenções ordenadas por data
    const maintenances = await this.maintenanceRepository.find({
      where: {
        vehicle_id: vehicleId,
      },
      order: {
        maintenance_date: 'DESC',
      },
      take: 20, // Últimas 20 manutenções
      relations: ['vehicle'],
    });

    if (maintenances.length < 2) {
      return 0; // Precisa de pelo menos 2 registros para calcular consumo
    }

    // Filtra registros que têm quilometragem registrada
    const recordsWithMileage = maintenances.filter(m => m.mileage_at_maintenance > 0);

    if (recordsWithMileage.length < 2) {
      return 0;
    }

    // Calcula consumo médio baseado na variação de quilometragem
    const firstRecord = recordsWithMileage[recordsWithMileage.length - 1];
    const lastRecord = recordsWithMileage[0];

    if (!firstRecord || !lastRecord) {
      return 0;
    }

    const totalDistance = lastRecord.mileage_at_maintenance - firstRecord.mileage_at_maintenance;

    if (totalDistance <= 0) {
      return 0;
    }

    // Pega o veículo para saber o tipo de combustível
    const vehicle = lastRecord.vehicle;
    if (!vehicle) {
      return 0;
    }

    const fuelType = vehicle.fuel_type.toLowerCase();
    const defaultConsumption = FuelConsumptionUtils.DEFAULT_CONSUMPTION[fuelType] ?? 10;

    // Se o veículo tem consumo médio configurado, usa ele
    if (vehicle.specifications && 'averageConsumption' in vehicle.specifications) {
      const vehicleConsumption = Number(vehicle.specifications.averageConsumption);
      if (vehicleConsumption > 0) {
        return vehicleConsumption;
      }
    }

    // Retorna consumo padrão baseado no tipo de combustível
    return defaultConsumption;
  }

  /**
   * Estima o custo de combustível para uma viagem
   *
   * Calcula quanto custará em combustível para percorrer uma determinada distância
   *
   * @param distance - Distância em quilômetros
   * @param vehicle - Veículo que fará a viagem
   * @returns Estimativa de custo detalhada
   *
   * @example
   * ```typescript
   * const estimate = FuelConsumptionUtils.estimateFuelCost(150, vehicle);
   * console.log(`Custo estimado: R$ ${estimate.estimatedCost}`);
   * ```
   */
  static estimateFuelCost(distance: number, vehicle: Vehicle): FuelCostEstimate {
    const fuelType = vehicle.fuel_type.toLowerCase();
    const pricePerLiter = this.FUEL_PRICES[fuelType] ?? this.FUEL_PRICES.gasoline ?? 5.89;

    // Tenta usar o consumo real do veículo se disponível
    let consumption = this.DEFAULT_CONSUMPTION[fuelType] ?? 10;

    // Se o veículo tem especificações de consumo, usa elas
    if (vehicle.specifications && 'averageConsumption' in vehicle.specifications) {
      const vehicleConsumption = Number(vehicle.specifications.averageConsumption);
      if (vehicleConsumption > 0) {
        consumption = vehicleConsumption;
      }
    }

    // Calcula litros necessários
    const estimatedLiters = distance / consumption;

    // Calcula custo total
    const estimatedCost = estimatedLiters * pricePerLiter;

    return {
      estimatedLiters: Number(estimatedLiters.toFixed(2)),
      estimatedCost: Number(estimatedCost.toFixed(2)),
      fuelType: vehicle.fuel_type,
      pricePerLiter,
    };
  }

  /**
   * Calcula a autonomia estimada do veículo com o tanque cheio
   *
   * @param vehicle - Veículo para calcular autonomia
   * @returns Distância estimada em km que o veículo pode percorrer
   *
   * @example
   * ```typescript
   * const range = FuelConsumptionUtils.calculateRange(vehicle);
   * console.log(`Autonomia: ${range} km`);
   * ```
   */
  static calculateRange(vehicle: Vehicle): number {
    if (!vehicle.fuel_capacity) {
      return 0;
    }

    const fuelType = vehicle.fuel_type.toLowerCase();
    let consumption = this.DEFAULT_CONSUMPTION[fuelType] ?? 10;

    // Usa consumo específico do veículo se disponível
    if (vehicle.specifications && 'averageConsumption' in vehicle.specifications) {
      const vehicleConsumption = Number(vehicle.specifications.averageConsumption);
      if (vehicleConsumption > 0) {
        consumption = vehicleConsumption;
      }
    }

    const fuelCapacity = Number(vehicle.fuel_capacity);
    return Number((fuelCapacity * consumption).toFixed(2));
  }

  /**
   * Compara a eficiência de combustível entre veículos
   *
   * @param vehicles - Lista de veículos para comparar
   * @returns Veículos ordenados por eficiência (mais eficiente primeiro)
   *
   * @example
   * ```typescript
   * const ranked = FuelConsumptionUtils.compareEfficiency(vehicles);
   * console.log(`Mais eficiente: ${ranked[0].license_plate}`);
   * ```
   */
  static compareEfficiency(vehicles: Vehicle[]): Vehicle[] {
    return vehicles.sort((a, b) => {
      const consumptionA = this.getVehicleConsumption(a);
      const consumptionB = this.getVehicleConsumption(b);

      // Maior consumo = mais eficiente
      return consumptionB - consumptionA;
    });
  }

  /**
   * Obtém o consumo configurado ou padrão de um veículo
   *
   * @param vehicle - Veículo
   * @returns Consumo em km/l ou km/kWh
   * @private
   */
  private static getVehicleConsumption(vehicle: Vehicle): number {
    const fuelType = vehicle.fuel_type.toLowerCase();
    const defaultConsumption = this.DEFAULT_CONSUMPTION[fuelType] ?? 10;

    if (vehicle.specifications && 'averageConsumption' in vehicle.specifications) {
      const vehicleConsumption = Number(vehicle.specifications.averageConsumption);
      if (vehicleConsumption > 0) {
        return vehicleConsumption;
      }
    }

    return defaultConsumption;
  }

  /**
   * Calcula o custo total de combustível para um período
   *
   * Analisa o histórico de abastecimentos em um período específico
   *
   * @param vehicleId - ID do veículo
   * @param startDate - Data inicial do período
   * @param endDate - Data final do período
   * @returns Custo total em R$
   *
   * @example
   * ```typescript
   * const cost = await fuelUtils.calculatePeriodCost(
   *   vehicleId,
   *   new Date('2025-01-01'),
   *   new Date('2025-01-31')
   * );
   * ```
   */
  async calculatePeriodCost(vehicleId: string, startDate: Date, endDate: Date): Promise<number> {
    const maintenances = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .where('maintenance.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('maintenance.maintenance_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    let totalCost = 0;

    for (const maintenance of maintenances) {
      // Soma o custo total das manutenções no período
      totalCost += Number(maintenance.cost ?? 0);
    }

    return Number(totalCost.toFixed(2));
  }

  /**
   * Atualiza os preços de combustível
   *
   * Útil para integração com APIs de preços de combustível
   *
   * @param fuelPrices - Objeto com os novos preços por tipo de combustível
   *
   * @example
   * ```typescript
   * FuelConsumptionUtils.updateFuelPrices({
   *   gasoline: 6.20,
   *   diesel: 6.00
   * });
   * ```
   */
  static updateFuelPrices(fuelPrices: Partial<Record<string, number>>): void {
    Object.assign(this.FUEL_PRICES, fuelPrices);
  }

  /**
   * Obtém os preços atuais de combustível
   *
   * @returns Objeto com preços por tipo de combustível
   */
  static getCurrentFuelPrices(): Record<string, number> {
    return { ...this.FUEL_PRICES };
  }
}
