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
    if (count >= 100) {
      this.logger.log(`Já existem ${count} entregas no sistema. Pulando seed.`);
      return;
    }

    // Buscar clientes, motoristas e veículos disponíveis
    const customers = await this.customerRepository.find({ take: 20 });
    const drivers = await this.driverRepository.find({ take: 5 });
    const vehicles = await this.vehicleRepository.find({ take: 5 });

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

    // Lista de estados brasileiros para distribuir as entregas
    const estados = [
      {
        sigla: "SP",
        nome: "São Paulo",
        cities: ["São Paulo", "Campinas", "Santos", "Sorocaba", "Ribeirão Preto"],
      },
      {
        sigla: "RJ",
        nome: "Rio de Janeiro",
        cities: ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Nova Iguaçu"],
      },
      {
        sigla: "MG",
        nome: "Minas Gerais",
        cities: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora"],
      },
      { sigla: "PR", nome: "Paraná", cities: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa"] },
      {
        sigla: "RS",
        nome: "Rio Grande do Sul",
        cities: ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas"],
      },
      {
        sigla: "SC",
        nome: "Santa Catarina",
        cities: ["Florianópolis", "Joinville", "Blumenau", "São José"],
      },
      {
        sigla: "BA",
        nome: "Bahia",
        cities: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari"],
      },
      {
        sigla: "PE",
        nome: "Pernambuco",
        cities: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru"],
      },
      {
        sigla: "GO",
        nome: "Goiás",
        cities: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde"],
      },
      {
        sigla: "ES",
        nome: "Espírito Santo",
        cities: ["Vitória", "Vila Velha", "Serra", "Cariacica"],
      },
    ];

    // Lista de descrições de produtos
    const descriptions = [
      "Pacote de eletrônicos",
      "Documentos urgentes",
      "Medicamentos",
      "Equipamentos de escritório",
      "Livros e materiais educativos",
      "Peças automotivas",
      "Roupas e acessórios",
      "Móveis e decoração",
      "Alimentos perecíveis",
      "Produtos de beleza",
      "Ferramentas",
      "Brinquedos",
      "Material de construção",
      "Produtos de limpeza",
      "Artigos esportivos",
    ];

    // Lista de prioridades
    const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

    // Lista de status
    const statuses = [
      "PENDING",
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "FAILED",
    ];

    // Criar 100 entregas distribuídas entre clientes e estados
    const deliveries: Partial<DeliveryEntity>[] = [];

    for (let i = 0; i < 100; i++) {
      const customer = customers[i % customers.length];
      const driver = drivers[i % drivers.length];
      const vehicle = vehicles[i % vehicles.length];
      const estadoOrigem = estados[i % estados.length];
      const estadoDestino = estados[(i + 3) % estados.length];
      const cidadeOrigem = estadoOrigem.cities[i % estadoOrigem.cities.length];
      const cidadeDestino = estadoDestino.cities[i % estadoDestino.cities.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      const description = descriptions[i % descriptions.length];

      // Calcular datas baseadas no status
      let scheduledPickupAt = new Date(now);
      let scheduledDeliveryAt = new Date(now);
      let actualPickupAt: Date | undefined;
      let actualDeliveryAt: Date | undefined;

      scheduledPickupAt.setDate(scheduledPickupAt.getDate() - Math.floor(Math.random() * 7));
      scheduledDeliveryAt.setDate(scheduledDeliveryAt.getDate() + Math.floor(Math.random() * 3));

      if (
        status === "PICKED_UP" ||
        status === "IN_TRANSIT" ||
        status === "OUT_FOR_DELIVERY" ||
        status === "DELIVERED" ||
        status === "FAILED"
      ) {
        actualPickupAt = new Date(scheduledPickupAt);
        actualPickupAt.setHours(actualPickupAt.getHours() + Math.floor(Math.random() * 4));
      }

      if (status === "DELIVERED") {
        actualDeliveryAt = new Date(scheduledDeliveryAt);
        actualDeliveryAt.setHours(actualDeliveryAt.getHours() - Math.floor(Math.random() * 6));
      }

      deliveries.push({
        tracking_code: `NEX${String(i + 1).padStart(9, "0")}BR`,
        status,
        priority,
        customer_id: customer.id,
        driver_id: driver.id,
        vehicle_id: vehicle.id,
        description,
        weight: Math.round((Math.random() * 20 + 0.5) * 10) / 10,
        declared_value: Math.round(Math.random() * 5000 + 50),
        pickup_address: {
          street: `Rua ${["Paulista", "Augusta", "Consolação", "Oscar Freire", "Rebouças", "Faria Lima", "Haddock Lobo", "Brasil", "XV de Novembro", "Marechal Deodoro"][i % 10]}`,
          number: String((i + 1) * 100),
          neighborhood: [
            "Centro",
            "Bela Vista",
            "Jardins",
            "Pinheiros",
            "Itaim Bibi",
            "Moema",
            "Vila Mariana",
            "Higienópolis",
          ][i % 8],
          city: cidadeOrigem,
          state: estadoOrigem.sigla,
          postal_code: `${String(Math.floor(Math.random() * 90000) + 10000)}-${String(Math.floor(Math.random() * 900) + 100)}`,
          latitude: -23.5 + (Math.random() - 0.5) * 2,
          longitude: -46.6 + (Math.random() - 0.5) * 2,
        },
        delivery_address: {
          street: `Rua ${["João Negrão", "Comendador Araújo", "Visconde de Nacar", "Sete de Setembro", "Marechal Deodoro", "XV de Novembro", "Brasil", "Cândido de Abreu", "Silva Jardim", "Almirante Tamandaré"][i % 10]}`,
          number: String((i + 1) * 50),
          neighborhood: [
            "Centro",
            "Batel",
            "Água Verde",
            "Mercês",
            "São Francisco",
            "Juvevê",
            "Bigorrilho",
            "Cristo Rei",
          ][i % 8],
          city: cidadeDestino,
          state: estadoDestino.sigla,
          postal_code: `${String(Math.floor(Math.random() * 90000) + 10000)}-${String(Math.floor(Math.random() * 900) + 100)}`,
          latitude: -25.4 + (Math.random() - 0.5) * 2,
          longitude: -49.2 + (Math.random() - 0.5) * 2,
        },
        scheduled_pickup_at: scheduledPickupAt,
        scheduled_delivery_at: scheduledDeliveryAt,
        actual_pickup_at: actualPickupAt,
        actual_delivery_at: actualDeliveryAt,
      });
    }

    // Salvar entregas
    for (const deliveryData of deliveries) {
      const delivery = this.deliveryRepository.create(deliveryData);
      await this.deliveryRepository.save(delivery);
      this.logger.log(`Entrega criada: ${deliveryData.tracking_code} - ${deliveryData.status}`);
    }

    this.logger.log(`${deliveries.length} entregas criadas com sucesso!`);
  }
}
