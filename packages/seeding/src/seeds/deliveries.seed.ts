import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";
import type {
  DeliveryEntity,
  CustomerEntity,
  DriverEntity,
  VehicleEntity,
} from "../interfaces/delivery-seed.interface";

/**
 * Seed de entregas de exemplo
 *
 * Cria entregas em diferentes status para desenvolvimento e testes
 */
@Injectable()
export class DeliveriesSeed implements ISeed {
  private readonly logger = new Logger(DeliveriesSeed.name);

  constructor(
    @Inject("DELIVERY_REPOSITORY")
    private readonly deliveryRepository: Repository<DeliveryEntity>,
    @Inject("CUSTOMER_REPOSITORY")
    private readonly customerRepository: Repository<CustomerEntity>,
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: Repository<DriverEntity>,
    @Inject("VEHICLE_REPOSITORY")
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de entregas...");

    // Verificar se já existem entregas
    const count = await this.deliveryRepository.count();
    if (count > 0) {
      this.logger.log(`Já existem ${count} entregas no sistema. Pulando seed.`);
      return;
    }

    // Buscar primeiro cliente, motorista e veículo disponíveis
    const customers = await this.customerRepository.find({ take: 3 });
    const drivers = await this.driverRepository.find({ take: 2 });
    const vehicles = await this.vehicleRepository.find({ take: 2 });

    if (customers.length === 0) {
      this.logger.warn("Nenhum cliente encontrado. Execute o seed de clientes primeiro.");
      return;
    }

    if (drivers.length === 0) {
      this.logger.warn("Nenhum motorista encontrado. Execute o seed de motoristas primeiro.");
      return;
    }

    if (vehicles.length === 0) {
      this.logger.warn("Nenhum veículo encontrado. Execute o seed de veículos primeiro.");
      return;
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Criar entregas de exemplo
    const deliveries: Partial<DeliveryEntity>[] = [
      // Entrega PENDING
      {
        tracking_code: "NEX001001001BR",
        status: "PENDING",
        priority: "NORMAL",
        customer_id: customers[0].id,
        description: "Pacote de eletrônicos",
        weight: 5.5,
        declared_value: 1500,
        pickup_address: {
          street: "Av. Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          postal_code: "01310-100",
          latitude: -23.561684,
          longitude: -46.655981,
        },
        delivery_address: {
          street: "Rua XV de Novembro",
          number: "500",
          neighborhood: "Centro",
          city: "Curitiba",
          state: "PR",
          postal_code: "80020-310",
          latitude: -25.437238,
          longitude: -49.269928,
        },
        scheduled_pickup_at: tomorrow,
        scheduled_delivery_at: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      },
      // Entrega ASSIGNED
      {
        tracking_code: "NEX001001002BR",
        status: "ASSIGNED",
        priority: "HIGH",
        customer_id: customers[0].id,
        driver_id: drivers[0].id,
        vehicle_id: vehicles[0].id,
        description: "Documentos urgentes",
        weight: 0.5,
        declared_value: 50,
        pickup_address: {
          street: "Rua da Consolação",
          number: "2000",
          city: "São Paulo",
          state: "SP",
          postal_code: "01302-001",
          latitude: -23.555771,
          longitude: -46.661423,
        },
        delivery_address: {
          street: "Av. Brasil",
          number: "1500",
          city: "Curitiba",
          state: "PR",
          postal_code: "80050-000",
          latitude: -25.432389,
          longitude: -49.271176,
        },
        scheduled_pickup_at: now,
        scheduled_delivery_at: tomorrow,
      },
      // Entrega IN_TRANSIT
      {
        tracking_code: "NEX001001003BR",
        status: "IN_TRANSIT",
        priority: "URGENT",
        customer_id: customers[1].id,
        driver_id: drivers[0].id,
        vehicle_id: vehicles[0].id,
        description: "Medicamentos",
        weight: 2.0,
        declared_value: 500,
        pickup_address: {
          street: "Rua Augusta",
          number: "3000",
          city: "São Paulo",
          state: "SP",
          postal_code: "01413-100",
          latitude: -23.562353,
          longitude: -46.658527,
        },
        delivery_address: {
          street: "Rua Marechal Deodoro",
          number: "800",
          city: "Curitiba",
          state: "PR",
          postal_code: "80010-010",
          latitude: -25.428954,
          longitude: -49.271915,
        },
        scheduled_pickup_at: yesterday,
        scheduled_delivery_at: now,
        actual_pickup_at: yesterday,
      },
      // Entrega OUT_FOR_DELIVERY
      {
        tracking_code: "NEX001001004BR",
        status: "OUT_FOR_DELIVERY",
        priority: "HIGH",
        customer_id: customers[1].id,
        driver_id: drivers[1].id,
        vehicle_id: vehicles[1].id,
        description: "Equipamentos de escritório",
        weight: 15.0,
        declared_value: 3000,
        pickup_address: {
          street: "Av. Faria Lima",
          number: "4000",
          city: "São Paulo",
          state: "SP",
          postal_code: "04538-132",
          latitude: -23.586942,
          longitude: -46.683517,
        },
        delivery_address: {
          street: "Rua João Negrão",
          number: "1200",
          city: "Curitiba",
          state: "PR",
          postal_code: "80010-200",
          latitude: -25.431398,
          longitude: -49.269336,
        },
        scheduled_pickup_at: yesterday,
        scheduled_delivery_at: now,
        actual_pickup_at: yesterday,
      },
      // Entrega DELIVERED
      {
        tracking_code: "NEX001001005BR",
        status: "DELIVERED",
        priority: "NORMAL",
        customer_id: customers[2].id,
        driver_id: drivers[1].id,
        vehicle_id: vehicles[1].id,
        description: "Livros e materiais educativos",
        weight: 8.0,
        declared_value: 800,
        pickup_address: {
          street: "Rua Oscar Freire",
          number: "2000",
          city: "São Paulo",
          state: "SP",
          postal_code: "01426-001",
          latitude: -23.561684,
          longitude: -46.672615,
        },
        delivery_address: {
          street: "Rua Comendador Araújo",
          number: "600",
          city: "Curitiba",
          state: "PR",
          postal_code: "80060-230",
          latitude: -25.434081,
          longitude: -49.268694,
        },
        scheduled_pickup_at: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
        scheduled_delivery_at: yesterday,
        actual_pickup_at: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
        actual_delivery_at: yesterday,
      },
      // Entrega FAILED
      {
        tracking_code: "NEX001001006BR",
        status: "FAILED",
        priority: "LOW",
        customer_id: customers[2].id,
        driver_id: drivers[0].id,
        vehicle_id: vehicles[0].id,
        description: "Peças automotivas",
        weight: 12.0,
        declared_value: 2000,
        pickup_address: {
          street: "Av. Rebouças",
          number: "5000",
          city: "São Paulo",
          state: "SP",
          postal_code: "05401-100",
          latitude: -23.569184,
          longitude: -46.671228,
        },
        delivery_address: {
          street: "Rua Visconde de Nacar",
          number: "1500",
          city: "Curitiba",
          state: "PR",
          postal_code: "80410-201",
          latitude: -25.446177,
          longitude: -49.239366,
        },
        scheduled_pickup_at: yesterday,
        scheduled_delivery_at: now,
        actual_pickup_at: yesterday,
      },
      // Entrega PICKED_UP
      {
        tracking_code: "NEX001001007BR",
        status: "PICKED_UP",
        priority: "NORMAL",
        customer_id: customers[0].id,
        driver_id: drivers[1].id,
        vehicle_id: vehicles[1].id,
        description: "Roupas e acessórios",
        weight: 6.5,
        declared_value: 1200,
        pickup_address: {
          street: "Rua Haddock Lobo",
          number: "800",
          city: "São Paulo",
          state: "SP",
          postal_code: "01414-000",
          latitude: -23.560325,
          longitude: -46.667632,
        },
        delivery_address: {
          street: "Rua Sete de Setembro",
          number: "3000",
          city: "Curitiba",
          state: "PR",
          postal_code: "80060-010",
          latitude: -25.433817,
          longitude: -49.271653,
        },
        scheduled_pickup_at: now,
        scheduled_delivery_at: tomorrow,
        actual_pickup_at: now,
      },
    ];

    // Salvar entregas
    for (const deliveryData of deliveries) {
      const delivery = this.deliveryRepository.create(deliveryData);
      await this.deliveryRepository.save(delivery);
      this.logger.log(`Entrega criada: ${deliveryData.tracking_code} - ${deliveryData.status}`);
    }

    this.logger.log(`${deliveries.length} entregas criadas com sucesso!`);
  }
}
