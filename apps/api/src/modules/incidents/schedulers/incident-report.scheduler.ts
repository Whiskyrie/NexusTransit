import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { IncidentExportService } from '../services/incident-export.service';
import { IncidentFilterDto } from '../dto/incident-filter.dto';

/**
 * Scheduler para geração automática de relatórios de incidentes
 *
 * Gera relatórios periódicos:
 * - Diário: resumo do dia anterior
 * - Semanal: resumo da semana
 * - Mensal: análise completa do mês
 *
 * TODO: Integrar com serviço de email para envio automático
 */
@Injectable()
export class IncidentReportScheduler {
  private readonly logger = new Logger(IncidentReportScheduler.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly exportService: IncidentExportService,
  ) {}

  /**
   * Relatório diário - executa todo dia às 00:00
   *
   * Gera relatório dos incidentes do dia anterior
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyReport(): Promise<void> {
    this.logger.log('Iniciando geração de relatório diário');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filterDto: IncidentFilterDto = {
        start_date: yesterday.toISOString(),
        end_date: today.toISOString(),
      };

      const count = await this.incidentRepository.count({
        where: {
          created_at: MoreThanOrEqual(yesterday),
        },
      });

      if (count === 0) {
        this.logger.log('Nenhum incidente registrado no dia anterior - relatório não gerado');
        return;
      }

      // Gerar CSV
      const csvBuffer = await this.exportService.exportToCSV(filterDto);
      const csvFilename = `relatorio_diario_${yesterday.toISOString().split('T')[0]}.csv`;

      // TODO: Salvar em storage ou enviar por email
      this.logger.log(`Relatório diário gerado: ${csvFilename} (${csvBuffer.length} bytes)`);
      this.logger.log(`Total de incidentes: ${count}`);

      // TODO: Implementar envio por email
      // await this.emailService.sendDailyReport(csvBuffer, csvFilename);
    } catch (error) {
      this.logger.error(
        'Erro ao gerar relatório diário',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Relatório semanal - executa toda segunda-feira às 08:00
   *
   * Gera relatório da semana anterior
   */
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_8AM)
  async generateWeeklyReport(): Promise<void> {
    // Verificar se é segunda-feira
    const now = new Date();
    if (now.getDay() !== 1) {
      return;
    }

    this.logger.log('Iniciando geração de relatório semanal');

    try {
      const lastMonday = new Date();
      lastMonday.setDate(lastMonday.getDate() - 7);
      lastMonday.setHours(0, 0, 0, 0);

      const thisMonday = new Date();
      thisMonday.setDate(thisMonday.getDate() - (thisMonday.getDay() - 1));
      thisMonday.setHours(0, 0, 0, 0);

      const filterDto: IncidentFilterDto = {
        start_date: lastMonday.toISOString(),
        end_date: thisMonday.toISOString(),
      };

      const count = await this.incidentRepository.count({
        where: {
          created_at: MoreThanOrEqual(lastMonday),
        },
      });

      if (count === 0) {
        this.logger.log('Nenhum incidente registrado na semana anterior - relatório não gerado');
        return;
      }

      // Gerar PDF consolidado
      const pdfStream = await this.exportService.exportIncidentsToPDF(filterDto);
      const pdfFilename = `relatorio_semanal_${lastMonday.toISOString().split('T')[0]}.pdf`;

      // TODO: Salvar stream em storage ou enviar por email
      this.logger.log(`Relatório semanal gerado: ${pdfFilename}`);
      this.logger.log(`Total de incidentes: ${count}`);

      // Consumir stream para evitar memory leak
      pdfStream.on('data', () => {
        // Consumir dados do stream para evitar memory leak
      });
      pdfStream.on('end', () => {
        this.logger.log('PDF stream consumido');
      });

      // TODO: Implementar envio por email
      // await this.emailService.sendWeeklyReport(pdfStream, pdfFilename);
    } catch (error) {
      this.logger.error(
        'Erro ao gerar relatório semanal',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Relatório mensal - executa no primeiro dia de cada mês às 09:00
   *
   * Gera relatório completo do mês anterior
   */
  @Cron('0 9 1 * *')
  async generateMonthlyReport(): Promise<void> {
    this.logger.log('Iniciando geração de relatório mensal');

    try {
      const now = new Date();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const filterDto: IncidentFilterDto = {
        start_date: firstDayLastMonth.toISOString(),
        end_date: firstDayThisMonth.toISOString(),
      };

      const count = await this.incidentRepository.count({
        where: {
          created_at: MoreThanOrEqual(firstDayLastMonth),
        },
      });

      if (count === 0) {
        this.logger.log('Nenhum incidente registrado no mês anterior - relatório não gerado');
        return;
      }

      // Gerar ambos: CSV e PDF
      const csvBuffer = await this.exportService.exportToCSV(filterDto);
      const csvFilename = `relatorio_mensal_${firstDayLastMonth.toISOString().split('T')[0]}.csv`;

      const pdfStream = await this.exportService.exportIncidentsToPDF(filterDto);
      const pdfFilename = `relatorio_mensal_${firstDayLastMonth.toISOString().split('T')[0]}.pdf`;

      this.logger.log(`Relatório mensal CSV gerado: ${csvFilename} (${csvBuffer.length} bytes)`);
      this.logger.log(`Relatório mensal PDF gerado: ${pdfFilename}`);
      this.logger.log(`Total de incidentes: ${count}`);

      // Consumir stream
      pdfStream.on('data', () => {
        // Consumir dados do stream para evitar memory leak
      });
      pdfStream.on('end', () => {
        this.logger.log('PDF stream consumido');
      });

      // TODO: Implementar envio por email
      // await this.emailService.sendMonthlyReport(csvBuffer, pdfStream, csvFilename, pdfFilename);
    } catch (error) {
      this.logger.error(
        'Erro ao gerar relatório mensal',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Gera estatísticas resumidas para incluir nos relatórios
   */
  private async generateStatsSummary(startDate: Date, endDate: Date): Promise<string> {
    const incidents = await this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.created_at >= :startDate', { startDate })
      .andWhere('incident.created_at < :endDate', { endDate })
      .getMany();

    const total = incidents.length;
    const bySeverity = incidents.reduce(
      (acc, inc) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = incidents.reduce(
      (acc, inc) => {
        acc[inc.status] = (acc[inc.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return `
Resumo do Período:
- Total de incidentes: ${total}
- Por severidade: ${JSON.stringify(bySeverity, null, 2)}
- Por status: ${JSON.stringify(byStatus, null, 2)}
    `.trim();
  }
}
