import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity';
import { Customer } from '../../customers/entities/customer.entity';
import {
  TopEstadoDto,
  TopClienteDto,
  DeliveryDashboardFilterDto,
} from '../dto/dashboard-stats.dto';
import { startOfDay, endOfDay, subDays } from 'date-fns';

/**
 * Serviço para Dashboard de Entregas
 *
 * Responsável por fornecer dados agregados e estatísticas
 * para visualização no dashboard do sistema.
 */
@Injectable()
export class DeliveryDashboardService {
  private readonly logger = new Logger(DeliveryDashboardService.name);

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Busca os top estados por volume de entregas
   *
   * @param filterDto Filtros opcionais (período, status, limite)
   * @returns Lista de estados ordenados por volume de entregas
   */
  async getTopEstados(filterDto: DeliveryDashboardFilterDto = {}): Promise<TopEstadoDto[]> {
    try {
      const { start_date, end_date, status, limit = 5 } = filterDto;

      // Criar query builder
      const queryBuilder = this.deliveryRepository
        .createQueryBuilder('delivery')
        .select("delivery.delivery_address->>'state'", 'estado')
        .addSelect('COUNT(delivery.id)', 'entregas')
        .where('delivery.deleted_at IS NULL');

      // Aplicar filtro de período
      if (start_date || end_date) {
        const startDate = start_date ? startOfDay(new Date(start_date)) : subDays(new Date(), 30);
        const endDate = end_date ? endOfDay(new Date(end_date)) : new Date();
        queryBuilder.andWhere('delivery.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      // Aplicar filtro de status
      if (status) {
        queryBuilder.andWhere('delivery.status = :status', { status });
      }

      // Agrupar por estado e ordenar
      queryBuilder
        .groupBy("delivery.delivery_address->>'state'")
        .orderBy('entregas', 'DESC')
        .limit(limit);

      // Executar query
      const results = await queryBuilder.getRawMany();

      // Calcular total para percentuais
      const total = results.reduce((sum, row) => sum + parseInt(row.entregas), 0);

      // Mapear resultados para DTO
      const topEstados: TopEstadoDto[] = results.map(row => {
        const estado = row.estado ?? 'Não informado';
        return {
          estado: this.getEstadoNome(estado),
          sigla: this.getEstadoSigla(estado),
          entregas: parseInt(row.entregas),
          percentual: total > 0 ? Math.round((parseInt(row.entregas) / total) * 100) : 0,
        };
      });

      this.logger.log(`Top ${limit} estados retornados: ${topEstados.length}`);
      return topEstados;
    } catch (error) {
      this.logger.error('Erro ao buscar top estados', error);
      return [];
    }
  }

  /**
   * Busca os top clientes por volume de entregas
   *
   * @param filterDto Filtros opcionais (período, status, limite)
   * @returns Lista de clientes ordenados por volume de entregas
   */
  async getTopClientes(filterDto: DeliveryDashboardFilterDto = {}): Promise<TopClienteDto[]> {
    try {
      const { start_date, end_date, status, limit = 5 } = filterDto;

      // Criar query builder com join na tabela de clientes
      const queryBuilder = this.deliveryRepository
        .createQueryBuilder('delivery')
        .select('customer.id', 'id')
        .addSelect('customer.name', 'nome')
        .addSelect('customer.category', 'categoria')
        .addSelect('COUNT(delivery.id)', 'entregas')
        .leftJoin('delivery.customer', 'customer')
        .where('delivery.deleted_at IS NULL')
        .andWhere('customer.deleted_at IS NULL');

      // Aplicar filtro de período
      if (start_date || end_date) {
        const startDate = start_date ? startOfDay(new Date(start_date)) : subDays(new Date(), 30);
        const endDate = end_date ? endOfDay(new Date(end_date)) : new Date();
        queryBuilder.andWhere('delivery.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      // Aplicar filtro de status
      if (status) {
        queryBuilder.andWhere('delivery.status = :status', { status });
      }

      // Agrupar por cliente e ordenar
      queryBuilder
        .groupBy('customer.id, customer.name, customer.category')
        .orderBy('entregas', 'DESC')
        .limit(limit);

      // Executar query
      const results = await queryBuilder.getRawMany();

      // Mapear resultados para DTO
      const topClientes: TopClienteDto[] = results.map(row => ({
        id: row.id,
        nome: row.nome ?? 'Cliente não informado',
        categoria: row.categoria ?? 'STANDARD',
        entregas: parseInt(row.entregas),
      }));

      this.logger.log(`Top ${limit} clientes retornados: ${topClientes.length}`);
      return topClientes;
    } catch (error) {
      this.logger.error('Erro ao buscar top clientes', error);
      return [];
    }
  }

  /**
   * Busca estatísticas gerais de entregas para o dashboard
   *
   * @param filterDto Filtros opcionais
   * @returns Estatísticas agregadas
   */
  async getStats(filterDto: DeliveryDashboardFilterDto = {}): Promise<{
    total: number;
    today: number;
    inTransit: number;
    delivered: number;
    pending: number;
    failed: number;
  }> {
    try {
      const { start_date, end_date } = filterDto;

      // Criar query builder
      const queryBuilder = this.deliveryRepository
        .createQueryBuilder('delivery')
        .select('COUNT(delivery.id)', 'total')
        .addSelect(
          'SUM(CASE WHEN DATE(delivery.created_at) = CURRENT_DATE THEN 1 ELSE 0 END)',
          'today',
        )
        .addSelect('SUM(CASE WHEN delivery.status = :inTransit THEN 1 ELSE 0 END)', 'inTransit')
        .addSelect('SUM(CASE WHEN delivery.status = :delivered THEN 1 ELSE 0 END)', 'delivered')
        .addSelect('SUM(CASE WHEN delivery.status = :pending THEN 1 ELSE 0 END)', 'pending')
        .addSelect('SUM(CASE WHEN delivery.status = :failed THEN 1 ELSE 0 END)', 'failed')
        .where('delivery.deleted_at IS NULL')
        .setParameter('inTransit', 'IN_TRANSIT')
        .setParameter('delivered', 'DELIVERED')
        .setParameter('pending', 'PENDING')
        .setParameter('failed', 'FAILED');

      // Aplicar filtro de período
      if (start_date ?? end_date) {
        const startDate = start_date ? startOfDay(new Date(start_date)) : subDays(new Date(), 30);
        const endDate = end_date ? endOfDay(new Date(end_date)) : new Date();
        queryBuilder.andWhere('delivery.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      // Executar query
      const result = await queryBuilder.getRawOne();

      return {
        total: parseInt(result?.total ?? '0'),
        today: parseInt(result?.today ?? '0'),
        inTransit: parseInt(result?.inTransit ?? '0'),
        delivered: parseInt(result?.delivered ?? '0'),
        pending: parseInt(result?.pending ?? '0'),
        failed: parseInt(result?.failed ?? '0'),
      };
    } catch (error) {
      this.logger.error('Erro ao buscar estatísticas', error);
      return {
        total: 0,
        today: 0,
        inTransit: 0,
        delivered: 0,
        pending: 0,
        failed: 0,
      };
    }
  }

  /**
   * Obtém o nome completo do estado a partir da sigla ou nome
   */
  private getEstadoNome(estado: string): string {
    const estadoMap: Record<string, string> = {
      AC: 'Acre',
      AL: 'Alagoas',
      AP: 'Amapá',
      AM: 'Amazonas',
      BA: 'Bahia',
      CE: 'Ceará',
      DF: 'Distrito Federal',
      ES: 'Espírito Santo',
      GO: 'Goiás',
      MA: 'Maranhão',
      MT: 'Mato Grosso',
      MS: 'Mato Grosso do Sul',
      MG: 'Minas Gerais',
      PA: 'Pará',
      PB: 'Paraíba',
      PR: 'Paraná',
      PE: 'Pernambuco',
      PI: 'Piauí',
      RJ: 'Rio de Janeiro',
      RN: 'Rio Grande do Norte',
      RS: 'Rio Grande do Sul',
      RO: 'Rondônia',
      RR: 'Roraima',
      SC: 'Santa Catarina',
      SP: 'São Paulo',
      SE: 'Sergipe',
      TO: 'Tocantins',
    };

    // Se já for o nome completo, retorna
    if (Object.values(estadoMap).includes(estado)) {
      return estado;
    }

    // Se for sigla, retorna o nome completo
    return estadoMap[estado.toUpperCase()] || estado;
  }

  /**
   * Obtém a sigla do estado a partir do nome ou sigla
   */
  private getEstadoSigla(estado: string): string {
    const siglaMap: Record<string, string> = {
      Acre: 'AC',
      Alagoas: 'AL',
      Amapá: 'AP',
      Amazonas: 'AM',
      Bahia: 'BA',
      Ceará: 'CE',
      'Distrito Federal': 'DF',
      'Espírito Santo': 'ES',
      Goiás: 'GO',
      Maranhão: 'MA',
      'Mato Grosso': 'MT',
      'Mato Grosso do Sul': 'MS',
      'Minas Gerais': 'MG',
      Pará: 'PA',
      Paraíba: 'PB',
      Paraná: 'PR',
      Pernambuco: 'PE',
      Piauí: 'PI',
      'Rio de Janeiro': 'RJ',
      'Rio Grande do Norte': 'RN',
      'Rio Grande do Sul': 'RS',
      Rondônia: 'RO',
      Roraima: 'RR',
      'Santa Catarina': 'SC',
      'São Paulo': 'SP',
      Sergipe: 'SE',
      Tocantins: 'TO',
    };

    // Se já for sigla, retorna
    if (Object.keys(siglaMap).includes(estado.toUpperCase())) {
      return estado.toUpperCase().substring(0, 2);
    }

    // Se for nome completo, retorna a sigla
    return siglaMap[estado] || estado.substring(0, 2).toUpperCase();
  }
}
