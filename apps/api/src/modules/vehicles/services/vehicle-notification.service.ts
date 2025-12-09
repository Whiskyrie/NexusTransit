import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import type { VehicleDocument } from '../entities/vehicle-document.entity';

/**
 * Service para gerenciamento de notificações relacionadas a veículos
 *
 * Responsável por:
 * - Notificar sobre manutenções vencidas/próximas
 * - Alertar sobre documentos expirando
 * - Enviar lembretes de renovação
 *
 * @class VehicleNotificationService
 */
@Injectable()
export class VehicleNotificationService {
  private readonly logger = new Logger(VehicleNotificationService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Notifica sobre manutenção vencida ou próxima do vencimento
   *
   * @param vehicle - Veículo que precisa de manutenção
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await notificationService.notifyMaintenanceDue(vehicle);
   * ```
   */
  notifyMaintenanceDue(vehicle: Vehicle): void {
    const now = new Date();
    const nextMaintenance = vehicle.next_maintenance_at;

    if (!nextMaintenance) {
      return;
    }

    const daysUntilMaintenance = Math.ceil(
      (new Date(nextMaintenance).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let message: string;
    let priority: 'high' | 'medium' | 'low';

    if (daysUntilMaintenance < 0) {
      message = `URGENTE: Veículo ${vehicle.license_plate} está com manutenção atrasada há ${Math.abs(daysUntilMaintenance)} dias!`;
      priority = 'high';
    } else if (daysUntilMaintenance <= 7) {
      message = `Atenção: Veículo ${vehicle.license_plate} precisa de manutenção em ${daysUntilMaintenance} dias.`;
      priority = 'high';
    } else if (daysUntilMaintenance <= 15) {
      message = `Lembrete: Veículo ${vehicle.license_plate} precisa de manutenção em ${daysUntilMaintenance} dias.`;
      priority = 'medium';
    } else {
      message = `Informativo: Veículo ${vehicle.license_plate} tem manutenção programada para ${new Date(nextMaintenance).toLocaleDateString()}.`;
      priority = 'low';
    }

    this.logger.log(`[${priority.toUpperCase()}] ${message}`);

    // TODO: Integrar com sistema de notificações (email, SMS, push, etc.)
    // await this.notificationService.send({
    //   type: 'maintenance_due',
    //   priority,
    //   message,
    //   vehicleId: vehicle.id,
    //   metadata: {
    //     licensePlate: vehicle.license_plate,
    //     nextMaintenanceDate: nextMaintenance,
    //     daysUntil: daysUntilMaintenance,
    //   },
    // });
  }

  /**
   * Notifica sobre documento expirando ou expirado
   *
   * @param vehicle - Veículo com documento expirando
   * @param document - Documento que está expirando
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await notificationService.notifyDocumentExpiring(vehicle, document);
   * ```
   */
  notifyDocumentExpiring(vehicle: Vehicle, document: VehicleDocument): void {
    if (!document.expiry_date) {
      return;
    }

    const now = new Date();
    const expiryDate = new Date(document.expiry_date);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let message: string;
    let priority: 'high' | 'medium' | 'low';

    if (daysUntilExpiry < 0) {
      message = `CRÍTICO: Documento ${document.document_type} do veículo ${vehicle.license_plate} EXPIRADO há ${Math.abs(daysUntilExpiry)} dias!`;
      priority = 'high';
    } else if (daysUntilExpiry <= 7) {
      message = `URGENTE: Documento ${document.document_type} do veículo ${vehicle.license_plate} expira em ${daysUntilExpiry} dias!`;
      priority = 'high';
    } else if (daysUntilExpiry <= 30) {
      message = `Atenção: Documento ${document.document_type} do veículo ${vehicle.license_plate} expira em ${daysUntilExpiry} dias.`;
      priority = 'medium';
    } else {
      message = `Lembrete: Documento ${document.document_type} do veículo ${vehicle.license_plate} expira em ${expiryDate.toLocaleDateString()}.`;
      priority = 'low';
    }

    this.logger.log(`[${priority.toUpperCase()}] ${message}`);

    // TODO: Integrar com sistema de notificações
    // await this.notificationService.send({
    //   type: 'document_expiring',
    //   priority,
    //   message,
    //   vehicleId: vehicle.id,
    //   documentId: document.id,
    //   metadata: {
    //     licensePlate: vehicle.license_plate,
    //     documentType: document.document_type,
    //     expiryDate: document.expiry_date,
    //     daysUntil: daysUntilExpiry,
    //   },
    // });
  }

  /**
   * Agenda notificações de manutenção para todos os veículos
   *
   * Verifica todos os veículos ativos e envia notificações para aqueles
   * que precisam de manutenção nos próximos 30 dias
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await notificationService.scheduleMaintenanceNotifications();
   * ```
   */
  async scheduleMaintenanceNotifications(): Promise<void> {
    this.logger.log('Iniciando verificação de manutenções pendentes...');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Busca veículos com manutenção programada nos próximos 30 dias
    const vehicles = await this.vehicleRepository.find({
      where: {
        next_maintenance_at: LessThan(thirtyDaysFromNow),
      },
      relations: ['documents'],
    });

    this.logger.log(`Encontrados ${vehicles.length} veículos com manutenção próxima`);

    for (const vehicle of vehicles) {
      this.notifyMaintenanceDue(vehicle);
    }

    this.logger.log('Verificação de manutenções concluída');
  }

  /**
   * Verifica e notifica sobre documentos expirando
   *
   * Busca todos os veículos e verifica documentos que expiram
   * nos próximos 30 dias
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await notificationService.checkExpiringDocuments();
   * ```
   */
  async checkExpiringDocuments(): Promise<void> {
    this.logger.log('Iniciando verificação de documentos expirando...');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Busca todos os veículos com seus documentos
    const vehicles = await this.vehicleRepository.find({
      relations: ['documents'],
    });

    let documentsChecked = 0;
    let notificationsSent = 0;

    for (const vehicle of vehicles) {
      if (!vehicle.documents || vehicle.documents.length === 0) {
        continue;
      }

      for (const document of vehicle.documents) {
        documentsChecked++;

        if (!document.expiry_date) {
          continue;
        }

        const expiryDate = new Date(document.expiry_date);

        // Notifica se o documento expirar nos próximos 30 dias ou já expirou
        if (expiryDate <= thirtyDaysFromNow) {
          this.notifyDocumentExpiring(vehicle, document);
          notificationsSent++;
        }
      }
    }

    this.logger.log(
      `Verificação concluída: ${documentsChecked} documentos verificados, ${notificationsSent} notificações enviadas`,
    );
  }

  /**
   * Envia resumo diário de manutenções e documentos
   *
   * Gera um relatório consolidado com todas as pendências
   *
   * @returns Promise<void>
   */
  async sendDailySummary(): Promise<void> {
    this.logger.log('Gerando resumo diário...');

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Manutenções urgentes (próximos 7 dias)
    const urgentMaintenances = await this.vehicleRepository.count({
      where: {
        next_maintenance_at: LessThan(sevenDaysFromNow),
      },
    });

    // Veículos com documentos expirando
    const vehiclesWithExpiringDocs = await this.vehicleRepository.find({
      relations: ['documents'],
    });

    let expiringDocsCount = 0;
    for (const vehicle of vehiclesWithExpiringDocs) {
      if (vehicle.documents) {
        expiringDocsCount += vehicle.documents.filter(doc => {
          if (!doc.expiry_date) {
            return false;
          }
          const expiryDate = new Date(doc.expiry_date);
          return expiryDate <= sevenDaysFromNow;
        }).length;
      }
    }

    const summary = {
      date: now.toLocaleDateString(),
      urgentMaintenances,
      expiringDocuments: expiringDocsCount,
      totalVehicles: await this.vehicleRepository.count(),
    };

    this.logger.log(`Resumo diário: ${JSON.stringify(summary, null, 2)}`);

    // TODO: Enviar por email para gestores
    // await this.emailService.sendDailySummary(summary);
  }
}
