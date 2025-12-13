import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleUtils } from '../utils/vehicle.util';
import { VehicleNotificationService } from './vehicle-notification.service';

/**
 * Service para agendamento e verificação de manutenções
 *
 * Responsável por:
 * - Agendar próximas manutenções
 * - Verificar manutenções vencidas
 * - Executar tarefas agendadas automaticamente
 *
 * @class MaintenanceScheduler
 */
@Injectable()
export class MaintenanceScheduler {
  private readonly logger = new Logger(MaintenanceScheduler.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly notificationService: VehicleNotificationService,
  ) {}

  /**
   * Agenda a próxima manutenção para um veículo
   *
   * Calcula a data ideal baseada em:
   * - Última manutenção realizada
   * - Quilometragem atual
   * - Intervalo recomendado pelo fabricante
   *
   * @param vehicle - Veículo para agendar manutenção
   * @returns Data da próxima manutenção programada
   *
   * @example
   * ```typescript
   * const nextDate = await scheduler.scheduleNextMaintenance(vehicle);
   * console.log(`Próxima manutenção: ${nextDate.toLocaleDateString()}`);
   * ```
   */
  async scheduleNextMaintenance(vehicle: Vehicle): Promise<Date> {
    const nextMaintenanceDate = VehicleUtils.calculateMaintenanceDue(vehicle);

    // Atualiza a data no banco de dados
    await this.vehicleRepository.update(vehicle.id, {
      next_maintenance_at: nextMaintenanceDate,
    });

    this.logger.log(
      `Manutenção agendada para veículo ${vehicle.license_plate}: ${nextMaintenanceDate.toLocaleDateString()}`,
    );

    return nextMaintenanceDate;
  }

  /**
   * Verifica todos os veículos com manutenção vencida
   *
   * @returns Lista de veículos que precisam de manutenção
   *
   * @example
   * ```typescript
   * const overdue = await scheduler.checkMaintenanceDue();
   * console.log(`${overdue.length} veículos com manutenção atrasada`);
   * ```
   */
  async checkMaintenanceDue(): Promise<Vehicle[]> {
    const now = new Date();

    const vehicles = await this.vehicleRepository.find({
      where: [
        // Veículos com manutenção vencida
        {
          next_maintenance_at: LessThanOrEqual(now),
        },
        // Veículos sem manutenção programada mas com última manutenção antiga
        {
          next_maintenance_at: IsNull(),
        },
      ],
      relations: ['maintenances'],
    });

    this.logger.log(
      `Encontrados ${vehicles.length} veículos com manutenção vencida ou não programada`,
    );

    return vehicles;
  }

  /**
   * Cron job: Verifica manutenções diariamente às 8h
   *
   * Executado automaticamente todos os dias às 8h da manhã
   * para verificar e notificar sobre manutenções pendentes
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: 'check-maintenance-due',
    timeZone: 'America/Sao_Paulo',
  })
  async handleMaintenanceCheck(): Promise<void> {
    this.logger.log('Iniciando verificação automática de manutenções...');

    try {
      const vehicles = await this.checkMaintenanceDue();

      if (vehicles.length === 0) {
        this.logger.log('Nenhum veículo com manutenção vencida');
        return;
      }

      // Notifica sobre cada veículo
      for (const vehicle of vehicles) {
        this.notificationService.notifyMaintenanceDue(vehicle);

        // Se não tem manutenção programada, agenda uma
        if (!vehicle.next_maintenance_at) {
          await this.scheduleNextMaintenance(vehicle);
        }
      }

      this.logger.log(`Verificação concluída: ${vehicles.length} veículos processados`);
    } catch (error) {
      this.logger.error('Erro ao verificar manutenções:', error);
    }
  }

  /**
   * Cron job: Envia notificações de manutenção semanalmente
   *
   * Executado toda segunda-feira às 9h para lembrar sobre
   * manutenções programadas para a semana
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-maintenance-notification',
    timeZone: 'America/Sao_Paulo',
  })
  async handleWeeklyNotifications(): Promise<void> {
    this.logger.log('Enviando notificações semanais de manutenção...');

    try {
      await this.notificationService.scheduleMaintenanceNotifications();
    } catch (error) {
      this.logger.error('Erro ao enviar notificações semanais:', error);
    }
  }

  /**
   * Cron job: Verifica documentos expirando diariamente às 9h
   *
   * Executado automaticamente para verificar documentos
   * que estão próximos do vencimento
   */
  @Cron('0 9 * * *', {
    name: 'check-expiring-documents',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDocumentExpiryCheck(): Promise<void> {
    this.logger.log('Iniciando verificação de documentos expirando...');

    try {
      await this.notificationService.checkExpiringDocuments();
    } catch (error) {
      this.logger.error('Erro ao verificar documentos:', error);
    }
  }

  /**
   * Cron job: Envia resumo diário às 18h
   *
   * Gera e envia relatório consolidado com todas as pendências
   */
  @Cron('0 18 * * *', {
    name: 'daily-summary',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailySummary(): Promise<void> {
    this.logger.log('Gerando resumo diário...');

    try {
      await this.notificationService.sendDailySummary();
    } catch (error) {
      this.logger.error('Erro ao gerar resumo diário:', error);
    }
  }

  /**
   * Atualiza as datas de manutenção para todos os veículos sem data programada
   *
   * Útil para executar manualmente ou em setup inicial
   *
   * @returns Número de veículos atualizados
   */
  async updateAllMaintenanceSchedules(): Promise<number> {
    this.logger.log('Atualizando agendamentos de manutenção...');

    const vehicles = await this.vehicleRepository.find({
      where: {
        next_maintenance_at: IsNull(),
      },
    });

    let updated = 0;

    for (const vehicle of vehicles) {
      try {
        await this.scheduleNextMaintenance(vehicle);
        updated++;
      } catch (error) {
        this.logger.error(
          `Erro ao agendar manutenção para veículo ${vehicle.license_plate}:`,
          error,
        );
      }
    }

    this.logger.log(`${updated} veículos atualizados com sucesso`);
    return updated;
  }

  /**
   * Cancela um agendamento de manutenção
   *
   * @param vehicleId - ID do veículo
   * @returns Promise<void>
   */
  async cancelMaintenanceSchedule(vehicleId: string): Promise<void> {
    await this.vehicleRepository
      .createQueryBuilder()
      .update(Vehicle)
      .set({ next_maintenance_at: () => 'NULL' })
      .where('id = :id', { id: vehicleId })
      .execute();

    this.logger.log(`Agendamento de manutenção cancelado para veículo ID: ${vehicleId}`);
  }

  /**
   * Reagenda uma manutenção para uma data específica
   *
   * @param vehicleId - ID do veículo
   * @param newDate - Nova data para a manutenção
   * @returns Promise<void>
   */
  async rescheduleMaintenance(vehicleId: string, newDate: Date): Promise<void> {
    await this.vehicleRepository.update(vehicleId, {
      next_maintenance_at: newDate,
    });

    this.logger.log(
      `Manutenção reagendada para veículo ID ${vehicleId}: ${newDate.toLocaleDateString()}`,
    );
  }
}
