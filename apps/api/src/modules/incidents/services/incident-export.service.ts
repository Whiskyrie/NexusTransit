import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createObjectCsvWriter } from 'csv-writer';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { Incident } from '../entities/incident.entity';
import { IncidentFilterDto } from '../dto/incident-filter.dto';
import {
  translateIncidentType,
  translateIncidentSeverity,
  translateIncidentStatus,
} from '../enums/incident.enums';
import { Readable } from 'stream';

/**
 * Service para exportação de incidentes em diferentes formatos
 *
 * Suporta:
 * - CSV (dados tabulares)
 * - PDF (relatórios formatados)
 */
@Injectable()
export class IncidentExportService {
  private readonly logger = new Logger(IncidentExportService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  /**
   * Exporta incidentes para CSV
   *
   * @param filterDto Filtros para seleção de incidentes
   * @returns Buffer contendo o arquivo CSV
   */
  async exportToCSV(filterDto: IncidentFilterDto): Promise<Buffer> {
    this.logger.log('Iniciando export CSV de incidentes');

    // Buscar incidentes com filtros
    const incidents = await this.findIncidentsForExport(filterDto);

    if (incidents.length === 0) {
      throw new NotFoundException('Nenhum incidente encontrado com os filtros aplicados');
    }

    // Preparar dados para CSV
    const csvData = incidents.map(incident => ({
      numero: incident.incident_number,
      tipo: translateIncidentType(incident.incident_type),
      severidade: translateIncidentSeverity(incident.severity),
      status: translateIncidentStatus(incident.status),
      descricao: incident.description,
      local: incident.location_address ?? 'N/A',
      latitude: incident.location ? 'Disponível' : 'N/A',
      longitude: incident.location ? 'Disponível' : 'N/A',
      impacto_entrega: incident.impact_on_delivery ? 'Sim' : 'Não',
      requer_seguro: incident.requires_insurance ? 'Sim' : 'Não',
      criado_em: incident.created_at.toISOString(),
      atualizado_em: incident.updated_at.toISOString(),
      resolvido_em: incident.resolved_at?.toISOString() ?? 'N/A',
      observacoes_resolucao: incident.resolution_notes ?? 'N/A',
    }));

    // Gerar CSV em memória
    const csvPath = `/tmp/incidents_export_${Date.now()}.csv`;

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'numero', title: 'Número' },
        { id: 'tipo', title: 'Tipo' },
        { id: 'severidade', title: 'Severidade' },
        { id: 'status', title: 'Status' },
        { id: 'descricao', title: 'Descrição' },
        { id: 'local', title: 'Endereço' },
        { id: 'latitude', title: 'Latitude' },
        { id: 'longitude', title: 'Longitude' },
        { id: 'impacto_entrega', title: 'Impacto na Entrega' },
        { id: 'requer_seguro', title: 'Requer Seguro' },
        { id: 'criado_em', title: 'Criado em' },
        { id: 'atualizado_em', title: 'Atualizado em' },
        { id: 'resolvido_em', title: 'Resolvido em' },
        { id: 'observacoes_resolucao', title: 'Observações de Resolução' },
      ],
    });

    await csvWriter.writeRecords(csvData);

    // Ler arquivo e retornar buffer
    const buffer = fs.readFileSync(csvPath);

    // Remover arquivo temporário
    fs.unlinkSync(csvPath);

    this.logger.log(`Export CSV concluído: ${incidents.length} incidentes exportados`);

    return buffer;
  }

  /**
   * Exporta um incidente específico para PDF
   *
   * @param incidentId ID do incidente
   * @returns Stream do PDF gerado
   */
  async exportIncidentToPDF(incidentId: string): Promise<Readable> {
    this.logger.log(`Gerando PDF para incidente ${incidentId}`);

    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      relations: ['delivery', 'route', 'driver', 'vehicle', 'reported_by_user', 'assigned_to_user'],
    });

    if (!incident) {
      throw new NotFoundException(`Incidente ${incidentId} não encontrado`);
    }

    return this.generateIncidentPDF(incident);
  }

  /**
   * Exporta múltiplos incidentes para PDF consolidado
   *
   * @param filterDto Filtros para seleção de incidentes
   * @returns Stream do PDF gerado
   */
  async exportIncidentsToPDF(filterDto: IncidentFilterDto): Promise<Readable> {
    this.logger.log('Gerando PDF consolidado de incidentes');

    const incidents = await this.findIncidentsForExport(filterDto);

    if (incidents.length === 0) {
      throw new NotFoundException('Nenhum incidente encontrado com os filtros aplicados');
    }

    return this.generateConsolidatedPDF(incidents, filterDto);
  }

  /**
   * Busca incidentes com filtros aplicados para export
   */
  private async findIncidentsForExport(filterDto: IncidentFilterDto): Promise<Incident[]> {
    const queryBuilder = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.delivery', 'delivery')
      .leftJoinAndSelect('incident.route', 'route')
      .leftJoinAndSelect('incident.driver', 'driver')
      .leftJoinAndSelect('incident.vehicle', 'vehicle');

    // Aplicar filtros
    if (filterDto.status) {
      queryBuilder.andWhere('incident.status = :status', { status: filterDto.status });
    }

    if (filterDto.severity) {
      queryBuilder.andWhere('incident.severity = :severity', { severity: filterDto.severity });
    }

    if (filterDto.incident_type) {
      queryBuilder.andWhere('incident.incident_type = :type', { type: filterDto.incident_type });
    }

    if (filterDto.start_date) {
      queryBuilder.andWhere('incident.created_at >= :startDate', {
        startDate: filterDto.start_date,
      });
    }

    if (filterDto.end_date) {
      queryBuilder.andWhere('incident.created_at <= :endDate', { endDate: filterDto.end_date });
    }

    queryBuilder.orderBy('incident.created_at', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Gera PDF para um incidente específico
   */
  private generateIncidentPDF(incident: Incident): Readable {
    const PDFDoc = PDFDocument as unknown as typeof PDFDocument.default;
    const doc = new PDFDoc({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Relatório de Incidente', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Número: ${incident.incident_number}`, { continued: true })
      .text(`    Data: ${incident.created_at.toLocaleDateString('pt-BR')}`, { align: 'right' })
      .moveDown();

    // Linha divisória
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

    // Informações principais
    doc.fontSize(14).font('Helvetica-Bold').text('Informações Gerais').moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    this.addLabelValue(doc, 'Tipo:', translateIncidentType(incident.incident_type));
    this.addLabelValue(doc, 'Severidade:', translateIncidentSeverity(incident.severity));
    this.addLabelValue(doc, 'Status:', translateIncidentStatus(incident.status));
    this.addLabelValue(doc, 'Descrição:', incident.description);

    doc.moveDown();

    // Localização
    if (incident.location_address) {
      doc.fontSize(14).font('Helvetica-Bold').text('Localização').moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      this.addLabelValue(doc, 'Endereço:', incident.location_address);
      if (incident.location) {
        this.addLabelValue(doc, 'Coordenadas:', 'Disponíveis no sistema (PostGIS)');
      }
      doc.moveDown();
    }

    // Impacto
    doc.fontSize(14).font('Helvetica-Bold').text('Impacto').moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    this.addLabelValue(doc, 'Impacto na Entrega:', incident.impact_on_delivery ? 'Sim' : 'Não');
    this.addLabelValue(doc, 'Requer Seguro:', incident.requires_insurance ? 'Sim' : 'Não');

    doc.moveDown();

    // Resolução
    if (incident.resolved_at || incident.resolution_notes) {
      doc.fontSize(14).font('Helvetica-Bold').text('Resolução').moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      if (incident.resolved_at) {
        this.addLabelValue(doc, 'Resolvido em:', incident.resolved_at.toLocaleString('pt-BR'));
      }
      if (incident.resolution_notes) {
        this.addLabelValue(doc, 'Observações:', incident.resolution_notes);
      }
    }

    // Footer
    doc
      .moveDown(2)
      .fontSize(8)
      .font('Helvetica')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, {
        align: 'center',
      });

    doc.end();

    return doc as unknown as Readable;
  }

  /**
   * Gera PDF consolidado com múltiplos incidentes
   */
  private generateConsolidatedPDF(incidents: Incident[], filterDto: IncidentFilterDto): Readable {
    const PDFDoc = PDFDocument as unknown as typeof PDFDocument.default;
    const doc = new PDFDoc({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Relatório Consolidado de Incidentes', { align: 'center' })
      .moveDown();

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total de incidentes: ${incidents.length}`, { align: 'center' })
      .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
      .moveDown();

    // Filtros aplicados
    if (filterDto.status || filterDto.severity || filterDto.incident_type) {
      doc.fontSize(12).font('Helvetica-Bold').text('Filtros Aplicados:').moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      if (filterDto.status) {
        this.addLabelValue(doc, 'Status:', translateIncidentStatus(filterDto.status));
      }
      if (filterDto.severity) {
        this.addLabelValue(doc, 'Severidade:', translateIncidentSeverity(filterDto.severity));
      }
      if (filterDto.incident_type) {
        this.addLabelValue(doc, 'Tipo:', translateIncidentType(filterDto.incident_type));
      }
      doc.moveDown();
    }

    // Lista de incidentes
    doc.fontSize(14).font('Helvetica-Bold').text('Incidentes').moveDown();

    incidents.forEach((incident, index) => {
      // Verificar se precisa de nova página
      if (doc.y > 700) {
        doc.addPage();
      }

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${incident.incident_number}`)
        .moveDown(0.3);

      doc.fontSize(9).font('Helvetica');
      this.addLabelValue(doc, 'Tipo:', translateIncidentType(incident.incident_type), true);
      this.addLabelValue(doc, 'Severidade:', translateIncidentSeverity(incident.severity), true);
      this.addLabelValue(doc, 'Status:', translateIncidentStatus(incident.status), true);
      this.addLabelValue(doc, 'Data:', incident.created_at.toLocaleDateString('pt-BR'), true);

      doc.moveDown(0.5);
    });

    doc.end();

    return doc as unknown as Readable;
  }

  /**
   * Helper para adicionar label-value no PDF
   */
  private addLabelValue(doc: unknown, label: string, value: string, compact = false): void {
    const spacing = compact ? 0.2 : 0.3;
    const pdfDoc = doc as PDFKit.PDFDocument;
    pdfDoc
      .font('Helvetica-Bold')
      .text(label, { continued: true })
      .font('Helvetica')
      .text(` ${value}`);
    pdfDoc.moveDown(spacing);
  }
}
