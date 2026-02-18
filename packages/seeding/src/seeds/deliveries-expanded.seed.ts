import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Enums para Delivery - devem corresponder exatamente aos valores do banco de dados
 */
enum DeliveryStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  ASSIGNED = "ASSIGNED",
  IN_TRANSIT = "IN_TRANSIT",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

enum DeliveryPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * Interface para Delivery Entity no seed
 */
export interface DeliveryEntity {
  id?: string;
  tracking_code: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  customer_id: string;
  driver_id?: string;
  vehicle_id?: string;
  pickup_address: Record<string, unknown>;
  delivery_address: Record<string, unknown>;
  pickup_contact?: Record<string, unknown>;
  delivery_contact: Record<string, unknown>;
  product_info: Record<string, unknown>;
  special_instructions?: string;
  scheduled_pickup_at?: Date;
  scheduled_delivery_at?: Date;
  actual_pickup_at?: Date;
  actual_delivery_at?: Date;
}

// Interface para Customer Entity
export interface CustomerEntity {
  id: string;
  name: string;
}

// Interface para Driver Entity
export interface DriverEntity {
  id: string;
  full_name: string;
}

// Interface para Vehicle Entity
export interface VehicleEntity {
  id: string;
  license_plate: string;
}

/**
 * Dados de endereços brasileiros
 */
const BRAZILIAN_ADDRESSES = [
  {
    street: "Av. Paulista",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zip: "01310-100",
    lat: -23.5614,
    lng: -46.6565,
  },
  {
    street: "Rua Augusta",
    neighborhood: "Consolação",
    city: "São Paulo",
    state: "SP",
    zip: "01305-000",
    lat: -23.5537,
    lng: -46.6593,
  },
  {
    street: "Av. Brasil",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
    zip: "20040-020",
    lat: -22.8963,
    lng: -43.2178,
  },
  {
    street: "Rua XV de Novembro",
    neighborhood: "Centro",
    city: "Curitiba",
    state: "PR",
    zip: "80020-310",
    lat: -25.4296,
    lng: -49.2714,
  },
  {
    street: "Av. Afonso Pena",
    neighborhood: "Centro",
    city: "Belo Horizonte",
    state: "MG",
    zip: "30130-000",
    lat: -19.9191,
    lng: -43.9386,
  },
  {
    street: "Rua dos Andradas",
    neighborhood: "Centro",
    city: "Porto Alegre",
    state: "RS",
    zip: "90020-000",
    lat: -30.0322,
    lng: -51.2302,
  },
  {
    street: "Av. Beira Mar",
    neighborhood: "Centro",
    city: "Florianópolis",
    state: "SC",
    zip: "88015-300",
    lat: -27.5949,
    lng: -48.5482,
  },
  {
    street: "Rua 85",
    neighborhood: "Setor Marista",
    city: "Goiânia",
    state: "GO",
    zip: "74160-010",
    lat: -16.6869,
    lng: -49.2648,
  },
  {
    street: "Av. Sete de Setembro",
    neighborhood: "Barra",
    city: "Salvador",
    state: "BA",
    zip: "40140-000",
    lat: -13.0114,
    lng: -38.5341,
  },
  {
    street: "Av. Boa Viagem",
    neighborhood: "Boa Viagem",
    city: "Recife",
    state: "PE",
    zip: "51020-000",
    lat: -8.1194,
    lng: -34.8927,
  },
  {
    street: "Av. Beira Mar",
    neighborhood: "Meireles",
    city: "Fortaleza",
    state: "CE",
    zip: "60165-120",
    lat: -3.7219,
    lng: -38.5108,
  },
  {
    street: "Av. Presidente Vargas",
    neighborhood: "Centro",
    city: "Belém",
    state: "PA",
    zip: "66010-000",
    lat: -1.4557,
    lng: -48.4902,
  },
  {
    street: "Av. Eduardo Ribeiro",
    neighborhood: "Centro",
    city: "Manaus",
    state: "AM",
    zip: "69010-001",
    lat: -3.1319,
    lng: -60.0233,
  },
  {
    street: "Av. CPA",
    neighborhood: "Centro Político",
    city: "Cuiabá",
    state: "MT",
    zip: "78050-000",
    lat: -15.6014,
    lng: -56.0979,
  },
  {
    street: "Rua 14 de Julho",
    neighborhood: "Centro",
    city: "Campo Grande",
    state: "MS",
    zip: "79002-000",
    lat: -20.4697,
    lng: -54.6201,
  },
  {
    street: "Av. Nossa Senhora da Penha",
    neighborhood: "Santa Lúcia",
    city: "Vitória",
    state: "ES",
    zip: "29045-400",
    lat: -20.2976,
    lng: -40.2958,
  },
  {
    street: "Av. Brasil",
    neighborhood: "Centro",
    city: "Campinas",
    state: "SP",
    zip: "13010-000",
    lat: -22.9064,
    lng: -47.0616,
  },
  {
    street: "Av. Francisco Junqueira",
    neighborhood: "Centro",
    city: "Ribeirão Preto",
    state: "SP",
    zip: "14010-030",
    lat: -21.1704,
    lng: -47.8103,
  },
  {
    street: "Rua das Laranjeiras",
    neighborhood: "Laranjeiras",
    city: "Rio de Janeiro",
    state: "RJ",
    zip: "22240-000",
    lat: -22.9316,
    lng: -43.1803,
  },
  {
    street: "Av. Atlântica",
    neighborhood: "Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
    zip: "22070-000",
    lat: -22.9714,
    lng: -43.1822,
  },
];

/**
 * Descrições de produtos
 */
const PRODUCT_DESCRIPTIONS = [
  "Eletrônicos diversos",
  "Roupas e acessórios",
  "Livros e materiais educativos",
  "Peças automotivas",
  "Cosméticos e perfumaria",
  "Alimentos não perecíveis",
  "Equipamentos de informática",
  "Móveis desmontados",
  "Medicamentos e suplementos",
  "Brinquedos",
  "Artigos esportivos",
  "Ferramentas e equipamentos",
  "Material de escritório",
  "Utensílios domésticos",
  "Produtos de limpeza",
  "Bebidas",
  "Calçados",
  "Bijuterias e acessórios",
  "Instrumentos musicais",
  "Peças de vestuário",
  "Acessórios para celular",
  "Produtos de beleza",
  "Artigos para pets",
  "Material de construção",
  "Produtos de jardinagem",
];

/**
 * Seed expandido de entregas
 *
 * Cria ~500 entregas para desenvolvimento e testes
 */
@Injectable()
export class DeliveriesExpandedSeed implements ISeed {
  private readonly logger = new Logger(DeliveriesExpandedSeed.name);

  constructor(
    @Inject("DATA_SOURCE")
    private readonly dataSource: DataSource,
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
    this.logger.log("Iniciando seed expandido de entregas...");

    // Verificar se já existem entregas suficientes
    const count = await this.deliveryRepository.count();
    if (count >= 300) {
      this.logger.log(`Já existem ${count} entregas no sistema. Pulando seed expandido.`);
      return;
    }

    // Buscar dados necessários
    const customers = await this.customerRepository.find({ take: 150 });
    const drivers = await this.driverRepository.find({ take: 50 });
    const vehicles = await this.vehicleRepository.find({ take: 50 });

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

    this.logger.log(`Criando entregas para ${customers.length} clientes...`);

    const now = new Date();
    let createdCount = 0;
    let trackingNumber = count + 1;

    // Criar ~500 entregas
    const targetCount = 500;
    const toCreate = targetCount - count;

    for (let i = 0; i < toCreate; i++) {
      try {
        const customer = customers[i % customers.length];
        const status = this.getRandomStatus();
        const priority = this.getRandomPriority();

        // Definir motorista e veículo baseado no status
        const needsDriverVehicle = [
          DeliveryStatus.ASSIGNED,
          DeliveryStatus.CONFIRMED,
          DeliveryStatus.IN_TRANSIT,
          DeliveryStatus.OUT_FOR_DELIVERY,
          DeliveryStatus.DELIVERED,
          DeliveryStatus.FAILED,
        ].includes(status);

        const driver = needsDriverVehicle ? drivers[i % drivers.length] : undefined;
        const vehicle = needsDriverVehicle ? vehicles[i % vehicles.length] : undefined;

        // Definir datas
        const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 a +30 dias
        const scheduledPickup = new Date(now);
        scheduledPickup.setDate(scheduledPickup.getDate() + daysOffset);
        scheduledPickup.setHours(
          8 + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 60),
          0,
          0,
        );

        const scheduledDelivery = new Date(scheduledPickup);
        scheduledDelivery.setDate(scheduledDelivery.getDate() + Math.floor(Math.random() * 3) + 1);

        // Definir datas reais baseado no status
        let actualPickup: Date | undefined;
        let actualDelivery: Date | undefined;

        if (
          [
            DeliveryStatus.CONFIRMED,
            DeliveryStatus.IN_TRANSIT,
            DeliveryStatus.OUT_FOR_DELIVERY,
            DeliveryStatus.DELIVERED,
            DeliveryStatus.FAILED,
          ].includes(status)
        ) {
          actualPickup = new Date(scheduledPickup.getTime() + Math.random() * 2 * 60 * 60 * 1000);
        }

        if (status === DeliveryStatus.DELIVERED) {
          actualDelivery = new Date(
            scheduledDelivery.getTime() + (Math.random() - 0.3) * 4 * 60 * 60 * 1000,
          );
        }

        // Selecionar endereços
        const pickupAddr = BRAZILIAN_ADDRESSES[i % BRAZILIAN_ADDRESSES.length];
        const deliveryAddr = BRAZILIAN_ADDRESSES[(i + 7) % BRAZILIAN_ADDRESSES.length];

        // Gerar nomes e telefones para contatos
        const firstNames = ["João", "Maria", "Pedro", "Ana", "Carlos", "Julia", "Lucas", "Mariana"];
        const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Costa", "Pereira"];
        const pickupName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
        const deliveryName = `${firstNames[(i + 3) % firstNames.length]} ${lastNames[(i + 2) % lastNames.length]}`;

        // Usar INSERT direto para contornar mapeamento da entity
        await this.dataSource.query(
          `INSERT INTO deliveries (
            tracking_code, status, priority, customer_id, driver_id, vehicle_id,
            pickup_address, delivery_address, pickup_contact, delivery_contact, product_info,
            special_instructions, scheduled_pickup_at, scheduled_delivery_at,
            actual_pickup_at, actual_delivery_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            `NEX${String(trackingNumber++).padStart(9, "0")}BR`,
            status,
            priority,
            customer.id,
            driver?.id || null,
            vehicle?.id || null,
            JSON.stringify({
              street: pickupAddr.street,
              number: String(100 + (i % 900)),
              neighborhood: pickupAddr.neighborhood,
              city: pickupAddr.city,
              state: pickupAddr.state,
              postal_code: pickupAddr.zip,
              latitude: pickupAddr.lat + (Math.random() - 0.5) * 0.01,
              longitude: pickupAddr.lng + (Math.random() - 0.5) * 0.01,
            }),
            JSON.stringify({
              street: deliveryAddr.street,
              number: String(200 + (i % 800)),
              neighborhood: deliveryAddr.neighborhood,
              city: deliveryAddr.city,
              state: deliveryAddr.state,
              postal_code: deliveryAddr.zip,
              latitude: deliveryAddr.lat + (Math.random() - 0.5) * 0.01,
              longitude: deliveryAddr.lng + (Math.random() - 0.5) * 0.01,
            }),
            JSON.stringify({
              name: pickupName,
              phone: `+55${11 + (i % 89)}9${String(Math.floor(Math.random() * 99999999)).padStart(8, "0")}`,
              email: `${pickupName.toLowerCase().replace(" ", ".")}@email.com`,
            }),
            JSON.stringify({
              name: deliveryName,
              phone: `+55${11 + ((i + 5) % 89)}9${String(Math.floor(Math.random() * 99999999)).padStart(8, "0")}`,
              email: `${deliveryName.toLowerCase().replace(" ", ".")}@email.com`,
            }),
            JSON.stringify({
              description: PRODUCT_DESCRIPTIONS[i % PRODUCT_DESCRIPTIONS.length],
              weight: Math.round((Math.random() * 50 + 0.5) * 10) / 10,
              quantity: Math.floor(Math.random() * 5) + 1,
              declared_value: Math.round(Math.random() * 10000 + 50),
            }),
            i % 3 === 0 ? "Entregar preferencialmente pela manhã" : null,
            scheduledPickup,
            scheduledDelivery,
            actualPickup || null,
            actualDelivery || null,
          ],
        );
        createdCount++;

        if (createdCount % 50 === 0) {
          this.logger.log(`Progresso: ${createdCount}/${toCreate} entregas criadas...`);
        }
      } catch (error) {
        this.logger.error(
          `Erro ao criar entrega: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed expandido de entregas concluído. ${createdCount} entregas criadas.`);
  }

  private getRandomStatus(): DeliveryStatus {
    const distribution = [
      { value: DeliveryStatus.PENDING, weight: 10 },
      { value: DeliveryStatus.CONFIRMED, weight: 5 },
      { value: DeliveryStatus.ASSIGNED, weight: 8 },
      { value: DeliveryStatus.IN_TRANSIT, weight: 15 },
      { value: DeliveryStatus.OUT_FOR_DELIVERY, weight: 10 },
      { value: DeliveryStatus.DELIVERED, weight: 42 },
      { value: DeliveryStatus.FAILED, weight: 7 },
      { value: DeliveryStatus.CANCELLED, weight: 3 },
    ];

    const totalWeight = distribution.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of distribution) {
      random -= item.weight;
      if (random <= 0) {
        return item.value;
      }
    }

    return DeliveryStatus.PENDING;
  }

  private getRandomPriority(): DeliveryPriority {
    const distribution = [
      { value: DeliveryPriority.LOW, weight: 15 },
      { value: DeliveryPriority.NORMAL, weight: 60 },
      { value: DeliveryPriority.HIGH, weight: 20 },
      { value: DeliveryPriority.CRITICAL, weight: 5 },
    ];

    const totalWeight = distribution.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of distribution) {
      random -= item.weight;
      if (random <= 0) {
        return item.value;
      }
    }

    return DeliveryPriority.NORMAL;
  }
}
