import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Interface para ServiceOrder Entity
 */
export interface ServiceOrderEntity {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  service_type: string;
  order_type: string;
  title: string;
  description: string;
  customer_id: string;
  pickup_address_id?: string;
  delivery_address_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  requested_date?: Date;
  scheduled_date?: Date;
  delivery_deadline?: Date;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  special_instructions?: string;
  estimated_cost: number;
  actual_cost?: number;
  payment_status: string;
  payment_method?: string;
  invoice_number?: string;
  total_weight?: number;
  total_volume?: number;
  package_count?: number;
  requires_insurance: boolean;
  insurance_value?: number;
  sla_hours?: number;
  notes?: string;
  created_by?: string;
}

/**
 * Interface para Customer Entity
 */
export interface CustomerEntity {
  id: string;
  name: string;
  category: string;
}

/**
 * Interface para CustomerAddress Entity
 */
export interface CustomerAddressEntity {
  id: string;
  customerId: string;
  street: string;
  city: string;
  state: string;
}

/**
 * Interface para Vehicle Entity
 */
export interface VehicleEntity {
  id: string;
  license_plate: string;
}

/**
 * Interface para Driver Entity
 */
export interface DriverEntity {
  id: string;
  name: string;
}

/**
 * Seed de ordens de serviço de exemplo
 *
 * Cria ordens de serviço em diferentes status para desenvolvimento e testes
 */
@Injectable()
export class ServiceOrdersSeed implements ISeed {
  private readonly logger = new Logger(ServiceOrdersSeed.name);

  constructor(
    @Inject("SERVICE_ORDER_REPOSITORY")
    private readonly serviceOrderRepository: Repository<ServiceOrderEntity>,
    @Inject("CUSTOMER_REPOSITORY")
    private readonly customerRepository: Repository<CustomerEntity>,
    @Inject("CUSTOMER_ADDRESS_REPOSITORY")
    private readonly customerAddressRepository: Repository<CustomerAddressEntity>,
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: Repository<DriverEntity>,
    @Inject("VEHICLE_REPOSITORY")
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de ordens de serviço...");

    // Verificar se já existem ordens suficientes
    const count = await this.serviceOrderRepository.count();
    if (count >= 350) {
      this.logger.log(`Já existem ${count} ordens de serviço no sistema. Pulando seed.`);
      return;
    }

    // Buscar dados necessários
    const customers = await this.customerRepository.find({ take: 150 });
    const addresses = await this.customerAddressRepository.find({ take: 300 });
    const drivers = await this.driverRepository.find({ take: 40 });
    const vehicles = await this.vehicleRepository.find({ take: 40 });

    if (customers.length === 0) {
      this.logger.warn("Nenhum cliente encontrado. Execute o seed de clientes primeiro.");
      return;
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Gerar número de ordem sequencial
    let orderCounter = 1;
    const generateOrderNumber = (): string => {
      const year = now.getFullYear();
      const num = String(orderCounter++).padStart(5, "0");
      return `OS-${year}-${num}`;
    };

    // Buscar endereços do primeiro cliente
    const customerAddresses = addresses.filter((a) => a.customerId === customers[0]?.id);
    const pickupAddress = customerAddresses[0];
    const deliveryAddress = customerAddresses[1] ?? customerAddresses[0];

    // Criar ordens de serviço de exemplo
    const serviceOrders: Partial<ServiceOrderEntity>[] = [
      // 1. Ordem PENDING - Aguardando aprovação
      {
        order_number: generateOrderNumber(),
        status: "PENDING",
        priority: "NORMAL",
        service_type: "DELIVERY",
        order_type: "PICKUP_DELIVERY",
        title: "Entrega de eletrônicos para revenda",
        description: "Coleta de 10 caixas de eletrônicos para entrega em loja parceira",
        customer_id: customers[0]?.id,
        pickup_address_id: pickupAddress?.id,
        delivery_address_id: deliveryAddress?.id,
        requested_date: tomorrow,
        scheduled_date: tomorrow,
        delivery_deadline: nextWeek,
        pickup_contact_name: "João Silva",
        pickup_contact_phone: "(11) 99999-1111",
        delivery_contact_name: "Maria Santos",
        delivery_contact_phone: "(11) 99999-2222",
        special_instructions: "Cuidado com produtos frágeis. Não empilhar mais de 3 caixas.",
        estimated_cost: 350.0,
        payment_status: "PENDING",
        total_weight: 45.5,
        total_volume: 0.8,
        package_count: 10,
        requires_insurance: true,
        insurance_value: 15000.0,
        sla_hours: 48,
        notes: "Cliente solicitou ligação antes da coleta",
        created_by: "admin",
      },

      // 2. Ordem SCHEDULED - Aprovada e agendada
      {
        order_number: generateOrderNumber(),
        status: "SCHEDULED",
        priority: "HIGH",
        service_type: "DELIVERY",
        order_type: "DELIVERY_ONLY",
        title: "Entrega urgente de medicamentos",
        description: "Entrega de medicamentos controlados para farmácia",
        customer_id: customers[1]?.id ?? customers[0]?.id,
        pickup_address_id: pickupAddress?.id,
        delivery_address_id: deliveryAddress?.id,
        vehicle_id: vehicles[0]?.id,
        driver_id: drivers[0]?.id,
        requested_date: now,
        scheduled_date: tomorrow,
        delivery_deadline: tomorrow,
        pickup_contact_name: "Carlos Farmacêutico",
        pickup_contact_phone: "(11) 99999-3333",
        delivery_contact_name: "Ana Gerente",
        delivery_contact_phone: "(11) 99999-4444",
        special_instructions:
          "Manter em temperatura controlada. Documento de transporte obrigatório.",
        estimated_cost: 280.0,
        payment_status: "PENDING",
        payment_method: "INVOICE",
        total_weight: 8.2,
        total_volume: 0.15,
        package_count: 3,
        requires_insurance: true,
        insurance_value: 5000.0,
        sla_hours: 24,
        notes: "Cliente VIP - prioridade alta",
        created_by: "admin",
      },

      // 3. Ordem IN_PROGRESS - Em execução
      {
        order_number: generateOrderNumber(),
        status: "IN_PROGRESS",
        priority: "NORMAL",
        service_type: "PICKUP",
        order_type: "RETURN",
        title: "Coleta de devolução de produtos",
        description: "Coleta de produtos devolvidos para logística reversa",
        customer_id: customers[2]?.id ?? customers[0]?.id,
        pickup_address_id: deliveryAddress?.id,
        delivery_address_id: pickupAddress?.id,
        vehicle_id: vehicles[1]?.id,
        driver_id: drivers[1]?.id,
        requested_date: yesterday,
        scheduled_date: now,
        delivery_deadline: tomorrow,
        pickup_contact_name: "Pedro Cliente",
        pickup_contact_phone: "(11) 99999-5555",
        delivery_contact_name: "Logística Central",
        delivery_contact_phone: "(11) 99999-6666",
        special_instructions: "Verificar estado dos produtos antes de aceitar devolução.",
        estimated_cost: 120.0,
        payment_status: "PAID",
        payment_method: "CREDIT_CARD",
        total_weight: 12.0,
        total_volume: 0.25,
        package_count: 5,
        requires_insurance: false,
        sla_hours: 72,
        notes: "Devolução por defeito de fabricação",
        created_by: "admin",
      },

      // 4. Ordem DELIVERED - Entregue
      {
        order_number: generateOrderNumber(),
        status: "DELIVERED",
        priority: "LOW",
        service_type: "TRANSFER",
        order_type: "TRANSFER",
        title: "Transferência entre filiais",
        description: "Transferência de estoque entre centros de distribuição",
        customer_id: customers[0]?.id,
        pickup_address_id: pickupAddress?.id,
        delivery_address_id: deliveryAddress?.id,
        vehicle_id: vehicles[2]?.id ?? vehicles[0]?.id,
        driver_id: drivers[2]?.id ?? drivers[0]?.id,
        requested_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        scheduled_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        delivery_deadline: yesterday,
        pickup_contact_name: "Estoque SP",
        pickup_contact_phone: "(11) 99999-7777",
        delivery_contact_name: "Estoque RJ",
        delivery_contact_phone: "(21) 99999-8888",
        estimated_cost: 850.0,
        actual_cost: 920.0,
        payment_status: "PAID",
        payment_method: "BANK_TRANSFER",
        invoice_number: "NF-2025-001234",
        total_weight: 250.0,
        total_volume: 3.5,
        package_count: 50,
        requires_insurance: true,
        insurance_value: 75000.0,
        sla_hours: 96,
        notes: "Transferência mensal de estoque concluída com sucesso",
        created_by: "admin",
      },

      // 5. Ordem CANCELLED - Cancelada
      {
        order_number: generateOrderNumber(),
        status: "CANCELLED",
        priority: "NORMAL",
        service_type: "DELIVERY",
        order_type: "PICKUP_DELIVERY",
        title: "Entrega de móveis (CANCELADA)",
        description: "Entrega de móveis para cliente residencial",
        customer_id: customers[3]?.id ?? customers[0]?.id,
        pickup_address_id: pickupAddress?.id,
        delivery_address_id: deliveryAddress?.id,
        requested_date: yesterday,
        scheduled_date: now,
        pickup_contact_name: "Loja Móveis",
        pickup_contact_phone: "(11) 99999-9999",
        delivery_contact_name: "Cliente Final",
        delivery_contact_phone: "(11) 99999-0000",
        estimated_cost: 450.0,
        payment_status: "CANCELED",
        total_weight: 80.0,
        total_volume: 2.0,
        package_count: 4,
        requires_insurance: true,
        insurance_value: 8000.0,
        sla_hours: 72,
        notes: "Cancelado a pedido do cliente - mudança de endereço",
        created_by: "admin",
      },

      // 6. Ordem PENDING com URGENT priority
      {
        order_number: generateOrderNumber(),
        status: "PENDING",
        priority: "URGENT",
        service_type: "DELIVERY",
        order_type: "DELIVERY_ONLY",
        title: "Entrega expressa de documentos",
        description: "Documentos urgentes para assinatura de contrato",
        customer_id: customers[4]?.id ?? customers[0]?.id,
        pickup_address_id: pickupAddress?.id,
        delivery_address_id: deliveryAddress?.id,
        requested_date: now,
        scheduled_date: now,
        delivery_deadline: now,
        pickup_contact_name: "Escritório Central",
        pickup_contact_phone: "(11) 99999-1234",
        delivery_contact_name: "Departamento Jurídico",
        delivery_contact_phone: "(11) 99999-5678",
        special_instructions: "URGENTE - Entregar em mãos ao destinatário. Aguardar assinatura.",
        estimated_cost: 180.0,
        payment_status: "PENDING",
        total_weight: 0.5,
        total_volume: 0.01,
        package_count: 1,
        requires_insurance: false,
        sla_hours: 4,
        notes: "Prazo crítico - contrato vence hoje",
        created_by: "admin",
      },
    ];

    // Gerar ordens adicionais para atingir ~350
    const additionalOrders = this.generateAdditionalOrders(
      customers,
      addresses,
      drivers,
      vehicles,
      350 - serviceOrders.length,
      orderCounter,
    );
    serviceOrders.push(...additionalOrders);

    // Inserir ordens de serviço
    for (const order of serviceOrders) {
      try {
        // Remover campos undefined
        const cleanOrder = Object.fromEntries(
          Object.entries(order).filter(([, v]) => v !== undefined),
        );

        const entity = this.serviceOrderRepository.create(
          cleanOrder as Partial<ServiceOrderEntity>,
        );
        await this.serviceOrderRepository.save(entity);
        this.logger.debug(`Ordem de serviço criada: ${order.order_number}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        this.logger.error(`Erro ao criar ordem ${order.order_number}: ${message}`);
      }
    }

    this.logger.log(`Seed de ordens de serviço concluído. ${serviceOrders.length} ordens criadas.`);
  }

  /**
   * Gera ordens de serviço adicionais dinamicamente
   */
  private generateAdditionalOrders(
    customers: CustomerEntity[],
    addresses: CustomerAddressEntity[],
    drivers: DriverEntity[],
    vehicles: VehicleEntity[],
    count: number,
    startCounter: number,
  ): Partial<ServiceOrderEntity>[] {
    const orders: Partial<ServiceOrderEntity>[] = [];
    const now = new Date();

    const statuses = ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
    const serviceTypes = [
      "STANDARD_DELIVERY",
      "EXPRESS_DELIVERY",
      "SAME_DAY",
      "COLLECTION",
      "RETURN",
    ];
    const orderTypes = ["PICKUP_DELIVERY", "DELIVERY_ONLY", "RETURN", "TRANSFER"];
    const paymentStatuses = ["PENDING", "PAID", "OVERDUE"];
    const paymentMethods = ["CREDIT_CARD", "BANK_TRANSFER", "INVOICE", "CASH"];

    const titles = [
      "Entrega de mercadorias",
      "Coleta de produtos",
      "Entrega expressa",
      "Entrega agendada",
      "Entrega de documentos",
      "Coleta de devolução",
      "Entrega fracionada",
      "Distribuição de amostras",
      "Entrega de e-commerce",
      "Transferência entre filiais",
    ];

    for (let i = 0; i < count; i++) {
      const customer = customers[i % customers.length];
      const customerAddrs = addresses.filter((a) => a.customerId === customer?.id);
      const pickupAddr = customerAddrs[0] || addresses[i % addresses.length];
      const deliveryAddr = customerAddrs[1] || addresses[(i + 1) % addresses.length];
      const driver = drivers.length > 0 ? drivers[i % drivers.length] : undefined;
      const vehicle = vehicles.length > 0 ? vehicles[i % vehicles.length] : undefined;

      const daysOffset = Math.floor(i / 10) - 15; // Entre 15 dias atrás e 20 dias no futuro
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() + daysOffset);

      const deadlineDate = new Date(orderDate);
      deadlineDate.setDate(deadlineDate.getDate() + (i % 5) + 1);

      const status = statuses[i % statuses.length];
      const isCompleted = status === "COMPLETED";
      const isCancelled = status === "CANCELLED";

      orders.push({
        order_number: `OS-${now.getFullYear()}-${String(startCounter + i).padStart(5, "0")}`,
        status,
        priority: priorities[i % priorities.length],
        service_type: serviceTypes[i % serviceTypes.length],
        order_type: orderTypes[i % orderTypes.length],
        title: titles[i % titles.length],
        description: `Ordem de serviço #${i + 1} - ${titles[i % titles.length]} para ${customer?.name || "Cliente"}`,
        customer_id: customer?.id,
        pickup_address_id: pickupAddr?.id,
        delivery_address_id: deliveryAddr?.id,
        vehicle_id: status !== "PENDING" && vehicle ? vehicle.id : undefined,
        driver_id: status !== "PENDING" && driver ? driver.id : undefined,
        requested_date: orderDate,
        scheduled_date: status !== "PENDING" ? orderDate : undefined,
        delivery_deadline: deadlineDate,
        pickup_contact_name: `Contato ${i + 1}`,
        pickup_contact_phone: `(11) 9${String(8000 + i).slice(0, 4)}-${String(1000 + i).slice(0, 4)}`,
        delivery_contact_name: `Destinatário ${i + 1}`,
        delivery_contact_phone: `(11) 9${String(7000 + i).slice(0, 4)}-${String(2000 + i).slice(0, 4)}`,
        estimated_cost: 50 + (i % 200),
        actual_cost: isCompleted ? 50 + (i % 200) + (i % 20) : undefined,
        payment_status: isCompleted
          ? "PAID"
          : isCancelled
            ? "CANCELED"
            : paymentStatuses[i % paymentStatuses.length],
        payment_method: paymentMethods[i % paymentMethods.length],
        invoice_number: isCompleted
          ? `NF-${now.getFullYear()}-${String(i + 1).padStart(6, "0")}`
          : undefined,
        total_weight: 1 + (i % 50),
        total_volume: 0.1 + (i % 10) * 0.1,
        package_count: 1 + (i % 10),
        requires_insurance: i % 5 === 0,
        insurance_value: i % 5 === 0 ? 500 + (i % 1000) : undefined,
        sla_hours: 24 + (i % 48),
        notes: i % 3 === 0 ? `Observações da ordem #${i + 1}` : undefined,
        created_by: "seed",
      });
    }

    return orders;
  }

  async revert(): Promise<void> {
    this.logger.log("Revertendo seed de ordens de serviço...");

    // Remover ordens criadas pelo seed (identificadas pelo created_by = 'admin')
    await this.serviceOrderRepository
      .createQueryBuilder()
      .delete()
      .where("created_by = :created_by", { created_by: "admin" })
      .execute();

    this.logger.log("Seed de ordens de serviço revertido.");
  }
}
