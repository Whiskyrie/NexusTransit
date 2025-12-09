/**
 * Interface para resultado de cálculo de consumo de combustível
 *
 * Representa os dados agregados sobre o consumo de um veículo
 */
export interface FuelConsumptionResult {
  /**
   * Consumo médio em km/l ou km/kWh
   */
  averageConsumption: number;

  /**
   * Distância total percorrida (em km)
   */
  totalDistance: number;

  /**
   * Total de combustível utilizado (em litros ou kWh)
   */
  totalFuelUsed: number;

  /**
   * Número de registros analisados
   */
  numberOfRecords: number;
}

/**
 * Interface para estimativa de custo de combustível
 *
 * Representa os dados de estimativa de custo para uma viagem
 */
export interface FuelCostEstimate {
  /**
   * Quantidade estimada de combustível (em litros ou kWh)
   */
  estimatedLiters: number;

  /**
   * Custo estimado total (em R$)
   */
  estimatedCost: number;

  /**
   * Tipo de combustível utilizado
   */
  fuelType: string;

  /**
   * Preço por litro ou kWh (em R$)
   */
  pricePerLiter: number;
}

/**
 * Interface para configuração de preços de combustível
 */
export interface FuelPriceConfig {
  /**
   * Preço da gasolina por litro (em R$)
   */
  gasoline?: number;

  /**
   * Preço do diesel por litro (em R$)
   */
  diesel?: number;

  /**
   * Preço do etanol por litro (em R$)
   */
  ethanol?: number;

  /**
   * Preço da energia elétrica por kWh (em R$)
   */
  electric?: number;

  /**
   * Preço do GNV por m³ (em R$)
   */
  gnv?: number;
}

/**
 * Interface para comparação de eficiência entre veículos
 */
export interface VehicleEfficiencyComparison {
  /**
   * ID do veículo
   */
  vehicleId: string;

  /**
   * Placa do veículo
   */
  licensePlate: string;

  /**
   * Consumo médio (km/l ou km/kWh)
   */
  averageConsumption: number;

  /**
   * Tipo de combustível
   */
  fuelType: string;

  /**
   * Ranking de eficiência (1 = mais eficiente)
   */
  efficiencyRank?: number;
}
