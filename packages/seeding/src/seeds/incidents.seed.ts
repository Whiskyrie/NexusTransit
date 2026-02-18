import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Enums para Incident
 */
enum IncidentType {
  TRAFFIC_ACCIDENT = "TRAFFIC_ACCIDENT",
  VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN",
  DELAYED_TRAFFIC = "DELAYED_TRAFFIC",
  CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
  WRONG_ADDRESS = "WRONG_ADDRESS",
  REFUSED_DELIVERY = "REFUSED_DELIVERY",
  THEFT = "THEFT",
  DAMAGE = "DAMAGE",
  WEATHER = "WEATHER",
  OTHER = "OTHER",
}

enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

enum IncidentStatus {
  REPORTED = "REPORTED",
  INVESTIGATING = "INVESTIGATING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

/**
 * Interface para Incident Entity no seed
 */
export interface IncidentEntity {
  id?: string;
  incident_number: string;
  delivery_id?: string;
  route_id?: string;
  driver_id: string;
  vehicle_id?: string;
  reported_by_user_id: string;
  assigned_to_user_id?: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location_address?: string;
  reported_at: Date;
  occurred_at?: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  estimated_loss?: number;
  impact_on_delivery?: boolean;
  requires_insurance?: boolean;
  notes?: string;
}

/**
 * Interface para IncidentComment Entity no seed
 */
export interface IncidentCommentEntity {
  id?: string;
  incident_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
}

/**
 * Interface para Delivery Entity no seed
 */
export interface DeliveryEntity {
  id: string;
  tracking_code: string;
  status: string;
  driver_id?: string;
}

/**
 * Interface para Driver Entity no seed
 */
export interface DriverEntity {
  id: string;
  full_name: string;
}

/**
 * Interface para Vehicle Entity no seed
 */
export interface VehicleEntity {
  id: string;
  license_plate: string;
}

/**
 * Interface para User Entity no seed
 */
export interface UserEntity {
  id: string;
  name: string;
}

/**
 * Seed de incidentes de exemplo
 *
 * Cria incidentes variados para desenvolvimento e testes
 * Volume: ~50 incidentes com comentários
 */
@Injectable()
export class IncidentsSeed implements ISeed {
  private readonly logger = new Logger(IncidentsSeed.name);

  constructor(
    @Inject("INCIDENT_REPOSITORY")
    private readonly incidentRepository: Repository<IncidentEntity>,
    @Inject("INCIDENT_COMMENT_REPOSITORY")
    private readonly incidentCommentRepository: Repository<IncidentCommentEntity>,
    @Inject("DELIVERY_REPOSITORY")
    private readonly deliveryRepository: Repository<DeliveryEntity>,
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: Repository<DriverEntity>,
    @Inject("VEHICLE_REPOSITORY")
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @Inject("USER_REPOSITORY")
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de incidentes...");

    // Verificar se já existem incidentes suficientes
    const count = await this.incidentRepository.count();
    if (count >= 30) {
      this.logger.log(`Já existem ${count} incidentes no sistema. Pulando seed.`);
      return;
    }

    // Buscar dados necessários
    const deliveries = await this.deliveryRepository.find({ take: 100 });
    const drivers = await this.driverRepository.find({ take: 50 });
    const vehicles = await this.vehicleRepository.find({ take: 50 });
    const users = await this.userRepository.find({ take: 10 });

    if (drivers.length === 0) {
      this.logger.warn("Nenhum motorista encontrado. Execute o seed de motoristas primeiro.");
      return;
    }

    if (users.length === 0) {
      this.logger.warn("Nenhum usuário encontrado. Execute o seed de usuários primeiro.");
      return;
    }

    this.logger.log("Criando incidentes...");

    const incidentsData = this.getIncidentsData(deliveries, drivers, vehicles, users);
    let createdCount = 0;

    for (const incidentData of incidentsData) {
      try {
        const incident = this.incidentRepository.create(incidentData.incident);
        const savedIncident = await this.incidentRepository.save(incident);

        this.logger.debug(`Incidente criado: ${savedIncident.incident_number}`);

        // Criar comentários para o incidente
        if (users.length > 0) {
          for (const commentData of incidentData.comments) {
            const comment = this.incidentCommentRepository.create({
              ...commentData,
              incident_id: savedIncident.id!,
              user_id: users[Math.floor(Math.random() * users.length)].id,
            });
            await this.incidentCommentRepository.save(comment);
          }
        }

        createdCount++;
      } catch (error) {
        this.logger.error(
          `Erro ao criar incidente: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed de incidentes concluído. ${createdCount} incidentes criados.`);
  }

  private getIncidentsData(
    deliveries: DeliveryEntity[],
    drivers: DriverEntity[],
    vehicles: VehicleEntity[],
    users: UserEntity[],
  ): Array<{
    incident: Partial<IncidentEntity>;
    comments: Partial<IncidentCommentEntity>[];
  }> {
    const now = new Date();
    const result: Array<{
      incident: Partial<IncidentEntity>;
      comments: Partial<IncidentCommentEntity>[];
    }> = [];

    // Incidentes de acidentes de trânsito
    const trafficAccidents = [
      {
        title: "Colisão leve em cruzamento",
        description:
          "Veículo colidiu com outro em cruzamento. Danos leves na lateral. Sem feridos.",
        severity: IncidentSeverity.MEDIUM,
        delay: 120,
        impact: 2500,
      },
      {
        title: "Engavetamento na rodovia",
        description: "Envolvimento em engavetamento na BR-116. Veículo com danos moderados.",
        severity: IncidentSeverity.HIGH,
        delay: 240,
        impact: 8000,
      },
      {
        title: "Acidente com moto",
        description: "Motociclista bateu no veículo parado. Danos no para-choque traseiro.",
        severity: IncidentSeverity.LOW,
        delay: 60,
        impact: 1500,
      },
    ];

    // Incidentes de quebra de veículo
    const vehicleBreakdowns = [
      {
        title: "Pneu furado",
        description: "Pneu traseiro direito furou em estrada de terra. Substituição realizada.",
        severity: IncidentSeverity.LOW,
        delay: 45,
        impact: 350,
      },
      {
        title: "Problema na bateria",
        description: "Bateria descarregou. Necessário socorro mecânico.",
        severity: IncidentSeverity.MEDIUM,
        delay: 90,
        impact: 800,
      },
      {
        title: "Superaquecimento do motor",
        description: "Motor superaqueceu devido a vazamento no sistema de arrefecimento.",
        severity: IncidentSeverity.HIGH,
        delay: 180,
        impact: 3500,
      },
      {
        title: "Falha no sistema de freios",
        description: "Freio apresentou falha. Veículo rebocado para oficina.",
        severity: IncidentSeverity.CRITICAL,
        delay: 360,
        impact: 5000,
      },
    ];

    // Incidentes de trânsito
    const trafficDelays = [
      {
        title: "Congestionamento intenso",
        description: "Trânsito parado na marginal. Atraso significativo na entrega.",
        severity: IncidentSeverity.LOW,
        delay: 90,
        impact: 0,
      },
      {
        title: "Bloqueio por manifestação",
        description: "Via bloqueada por manifestação pública. Rota alternativa necessária.",
        severity: IncidentSeverity.MEDIUM,
        delay: 150,
        impact: 200,
      },
      {
        title: "Interdição por obras",
        description: "Rua interditada para obras da prefeitura. Desvio de 5km.",
        severity: IncidentSeverity.LOW,
        delay: 40,
        impact: 100,
      },
    ];

    // Incidentes com cliente
    const customerIssues = [
      {
        title: "Cliente não encontrado",
        description: "Endereço correto mas cliente não estava no local. 3 tentativas realizadas.",
        severity: IncidentSeverity.LOW,
        delay: 0,
        impact: 50,
        type: IncidentType.CUSTOMER_NOT_FOUND,
      },
      {
        title: "Endereço inexistente",
        description: "Número do endereço não existe na rua informada.",
        severity: IncidentSeverity.MEDIUM,
        delay: 60,
        impact: 100,
        type: IncidentType.WRONG_ADDRESS,
      },
      {
        title: "Entrega recusada",
        description: "Cliente recusou receber a mercadoria alegando divergência no pedido.",
        severity: IncidentSeverity.MEDIUM,
        delay: 0,
        impact: 250,
        type: IncidentType.REFUSED_DELIVERY,
      },
    ];

    // Incidentes de roubo/furto
    const theftIncidents = [
      {
        title: "Tentativa de assalto",
        description: "Motorista sofreu tentativa de assalto. Carga preservada. Veículo danificado.",
        severity: IncidentSeverity.CRITICAL,
        delay: 480,
        impact: 15000,
      },
      {
        title: "Carga parcialmente furtada",
        description: "Parte da carga foi furtada durante parada para almoço.",
        severity: IncidentSeverity.HIGH,
        delay: 120,
        impact: 6000,
      },
    ];

    // Incidentes de dano
    const damageIncidents = [
      {
        title: "Carga danificada por chuva",
        description: "Infiltração de água no baú danificou parte da carga.",
        severity: IncidentSeverity.MEDIUM,
        delay: 30,
        impact: 1800,
      },
      {
        title: "Produto frágil quebrado",
        description: "Produto frágil quebrou durante transporte. Embalagem inadequada.",
        severity: IncidentSeverity.LOW,
        delay: 0,
        impact: 500,
      },
      {
        title: "Carga deslocada no baú",
        description: "Freada brusca causou deslocamento da carga. Alguns itens danificados.",
        severity: IncidentSeverity.MEDIUM,
        delay: 45,
        impact: 2200,
      },
    ];

    // Incidentes climáticos
    const weatherIncidents = [
      {
        title: "Alagamento na via",
        description: "Via alagada após forte chuva. Impossível prosseguir.",
        severity: IncidentSeverity.HIGH,
        delay: 180,
        impact: 0,
      },
      {
        title: "Neblina intensa",
        description: "Neblina intensa na serra. Viagem suspensa por segurança.",
        severity: IncidentSeverity.MEDIUM,
        delay: 240,
        impact: 0,
      },
    ];

    // Outros incidentes
    const otherIncidents = [
      {
        title: "Documentação irregular",
        description: "Fiscalização detectou irregularidade na documentação da carga.",
        severity: IncidentSeverity.MEDIUM,
        delay: 120,
        impact: 500,
      },
      {
        title: "Problema com balança",
        description: "Veículo retido por sobrepeso na balança. Necessário transferência de carga.",
        severity: IncidentSeverity.HIGH,
        delay: 300,
        impact: 2000,
      },
    ];

    // Gerar incidentes
    let incidentNumber = 1;

    // Helper para criar incidente
    const createIncident = (
      data: {
        title: string;
        description: string;
        severity: IncidentSeverity;
        delay: number;
        impact: number;
        type?: IncidentType;
      },
      type: IncidentType,
      status: IncidentStatus,
      daysAgo: number,
    ) => {
      const reportedAt = new Date(now);
      reportedAt.setDate(reportedAt.getDate() - daysAgo);

      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const vehicle =
        vehicles.length > 0 ? vehicles[Math.floor(Math.random() * vehicles.length)] : undefined;
      const delivery =
        deliveries.length > 0
          ? deliveries[Math.floor(Math.random() * deliveries.length)]
          : undefined;
      const reporter = users[Math.floor(Math.random() * users.length)];
      const assignee =
        Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : undefined;

      const resolvedAt =
        status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED
          ? new Date(reportedAt.getTime() + (Math.random() * 48 + 2) * 60 * 60 * 1000)
          : undefined;

      const resolutionNotes = resolvedAt
        ? `Incidente resolvido após análise. Impacto estimado: R$ ${data.impact.toFixed(2)}`
        : undefined;

      return {
        incident: {
          incident_number: `INC-${String(incidentNumber++).padStart(6, "0")}`,
          delivery_id: delivery?.id,
          driver_id: driver.id,
          vehicle_id: vehicle?.id,
          reported_by_user_id: reporter.id,
          assigned_to_user_id: assignee?.id,
          incident_type: data.type || type,
          severity: data.severity,
          status,
          title: data.title,
          description: data.description,
          location_address: `Rodovia BR-${Math.floor(Math.random() * 400) + 100}, km ${Math.floor(Math.random() * 500)}`,
          reported_at: reportedAt,
          occurred_at: new Date(reportedAt.getTime() - Math.random() * 60 * 60 * 1000),
          resolved_at: resolvedAt,
          resolution_notes: resolutionNotes,
          estimated_loss: data.impact > 0 ? data.impact : undefined,
          impact_on_delivery: delivery !== undefined,
          requires_insurance: data.impact > 1000,
          notes: `Incidente registrado automaticamente pelo sistema de seed. Atraso estimado: ${data.delay} minutos.`,
        },
        comments: this.generateComments(status),
      };
    };

    // Adicionar incidentes de cada tipo
    trafficAccidents.forEach((data, i) => {
      const status =
        i === 0
          ? IncidentStatus.RESOLVED
          : i === 1
            ? IncidentStatus.IN_PROGRESS
            : IncidentStatus.CLOSED;
      result.push(createIncident(data, IncidentType.TRAFFIC_ACCIDENT, status, i * 3 + 1));
    });

    vehicleBreakdowns.forEach((data, i) => {
      const status =
        i < 2
          ? IncidentStatus.RESOLVED
          : i === 2
            ? IncidentStatus.INVESTIGATING
            : IncidentStatus.REPORTED;
      result.push(createIncident(data, IncidentType.VEHICLE_BREAKDOWN, status, i * 2 + 1));
    });

    trafficDelays.forEach((data, i) => {
      result.push(
        createIncident(data, IncidentType.DELAYED_TRAFFIC, IncidentStatus.CLOSED, i * 4 + 2),
      );
    });

    customerIssues.forEach((data, i) => {
      const status = i === 0 ? IncidentStatus.CLOSED : IncidentStatus.RESOLVED;
      result.push(createIncident(data, data.type!, status, i * 2 + 1));
    });

    theftIncidents.forEach((data, i) => {
      const status = i === 0 ? IncidentStatus.INVESTIGATING : IncidentStatus.IN_PROGRESS;
      result.push(createIncident(data, IncidentType.THEFT, status, i * 5 + 3));
    });

    damageIncidents.forEach((data, i) => {
      const status = i < 2 ? IncidentStatus.RESOLVED : IncidentStatus.CLOSED;
      result.push(createIncident(data, IncidentType.DAMAGE, status, i * 3 + 2));
    });

    weatherIncidents.forEach((data, i) => {
      result.push(createIncident(data, IncidentType.WEATHER, IncidentStatus.CLOSED, i * 7 + 5));
    });

    otherIncidents.forEach((data, i) => {
      const status = i === 0 ? IncidentStatus.RESOLVED : IncidentStatus.IN_PROGRESS;
      result.push(createIncident(data, IncidentType.OTHER, status, i * 4 + 3));
    });

    // Adicionar mais incidentes aleatórios para completar ~50
    const allTypes = [
      { data: trafficAccidents, type: IncidentType.TRAFFIC_ACCIDENT },
      { data: vehicleBreakdowns, type: IncidentType.VEHICLE_BREAKDOWN },
      { data: trafficDelays, type: IncidentType.DELAYED_TRAFFIC },
      { data: damageIncidents, type: IncidentType.DAMAGE },
    ];

    for (let i = 0; i < 25; i++) {
      const typeGroup = allTypes[Math.floor(Math.random() * allTypes.length)];
      const data = typeGroup.data[Math.floor(Math.random() * typeGroup.data.length)];
      const statuses = [
        IncidentStatus.REPORTED,
        IncidentStatus.INVESTIGATING,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.RESOLVED,
        IncidentStatus.CLOSED,
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      result.push(createIncident(data, typeGroup.type, status, Math.floor(Math.random() * 60) + 1));
    }

    return result;
  }

  private generateComments(status: IncidentStatus): Partial<IncidentCommentEntity>[] {
    const comments: Partial<IncidentCommentEntity>[] = [];

    // Comentário inicial
    comments.push({
      content: "Incidente registrado. Iniciando análise.",
      is_internal: true,
    });

    if (status !== IncidentStatus.REPORTED) {
      comments.push({
        content: "Incidente em investigação. Coletando informações adicionais.",
        is_internal: true,
      });
    }

    if (
      status === IncidentStatus.IN_PROGRESS ||
      status === IncidentStatus.RESOLVED ||
      status === IncidentStatus.CLOSED
    ) {
      comments.push({
        content: "Ações corretivas em andamento.",
        is_internal: false,
      });
    }

    if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED) {
      comments.push({
        content: "Incidente resolvido. Documentação finalizada.",
        is_internal: true,
      });
    }

    if (status === IncidentStatus.CLOSED) {
      comments.push({
        content: "Caso encerrado. Relatório arquivado.",
        is_internal: true,
      });
    }

    return comments;
  }
}
