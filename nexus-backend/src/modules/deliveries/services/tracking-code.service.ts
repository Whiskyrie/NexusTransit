import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity';

/**
 * Interface para código de rastreamento parseado
 */
export interface ParsedTrackingCode {
  prefix: string;
  date: string;
  sequence: string;
  fullCode: string;
}

/**
 * Serviço para geração e validação de códigos de rastreamento de entregas
 *
 * Responsabilidades:
 * - Gerar códigos únicos de rastreamento
 * - Validar formato e existência de códigos
 * - Fazer parsing de códigos
 * - Regenerar códigos se necessário
 *
 * @class TrackingCodeService
 */
@Injectable()
export class TrackingCodeService {
  private readonly PREFIX = 'NXT';
  private readonly SEQUENCE_LENGTH = 5;

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  /**
   * Gera um código de rastreamento único
   *
   * Formato: NXT-YYYYMMDD-XXXXX
   * - NXT: Prefixo fixo (NexusTransit)
   * - YYYYMMDD: Data atual
   * - XXXXX: Sequência numérica de 5 dígitos
   *
   * @returns Código de rastreamento único
   * @throws Error se não conseguir gerar código único após 10 tentativas
   *
   * @example
   * ```typescript
   * const code = await service.generateUniqueCode();
   * // Returns: "NXT-20240115-00001"
   * ```
   */
  async generateUniqueCode(): Promise<string> {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const code = await this.generateCode();

      const exists = await this.deliveryRepository.existsBy({
        tracking_code: code,
      });

      if (!exists) {
        return code;
      }

      attempts++;
    }

    throw new Error(
      'Não foi possível gerar um código de rastreamento único após várias tentativas',
    );
  }

  /**
   * Valida o formato de um código de rastreamento
   *
   * @param code - Código a ser validado
   * @returns True se o código é válido, false caso contrário
   *
   * @example
   * ```typescript
   * const isValid = service.validateCode('NXT-20240115-00001');
   * // Returns: true
   *
   * const isInvalid = service.validateCode('INVALID');
   * // Returns: false
   * ```
   */
  validateCode(code: string): boolean {
    const pattern = /^NXT-\d{8}-\d{5}$/;
    return pattern.test(code);
  }

  /**
   * Verifica se um código de rastreamento existe no banco de dados
   *
   * @param code - Código de rastreamento
   * @returns True se o código existe, false caso contrário
   *
   * @example
   * ```typescript
   * const exists = await service.codeExists('NXT-20240115-00001');
   * ```
   */
  async codeExists(code: string): Promise<boolean> {
    return this.deliveryRepository.existsBy({
      tracking_code: code,
    });
  }

  /**
   * Faz o parsing de um código de rastreamento
   *
   * Extrai as partes componentes do código:
   * - Prefixo (NXT)
   * - Data (YYYYMMDD)
   * - Sequência (XXXXX)
   *
   * @param code - Código de rastreamento
   * @returns Objeto com as partes do código ou null se inválido
   *
   * @example
   * ```typescript
   * const parsed = service.parseCode('NXT-20240115-00001');
   * // Returns: {
   * //   prefix: 'NXT',
   * //   date: '20240115',
   * //   sequence: '00001',
   * //   fullCode: 'NXT-20240115-00001'
   * // }
   * ```
   */
  parseCode(code: string): ParsedTrackingCode | null {
    if (!this.validateCode(code)) {
      return null;
    }

    const parts = code.split('-');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      return null;
    }

    return {
      prefix: parts[0],
      date: parts[1],
      sequence: parts[2],
      fullCode: code,
    };
  }

  /**
   * Regenera um código de rastreamento para uma entrega
   *
   * Útil quando há necessidade de criar um novo código para uma entrega existente
   *
   * @param deliveryId - ID da entrega
   * @returns Novo código de rastreamento
   * @throws Error se a entrega não for encontrada
   *
   * @example
   * ```typescript
   * const newCode = await service.regenerateCode('delivery-id-123');
   * ```
   */
  async regenerateCode(deliveryId: string): Promise<string> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error('Entrega não encontrada');
    }

    const newCode = await this.generateUniqueCode();

    await this.deliveryRepository.update(deliveryId, {
      tracking_code: newCode,
    });

    return newCode;
  }

  /**
   * Obtém o próximo número de sequência para a data atual
   *
   * @returns Próximo número de sequência disponível
   * @private
   */
  private async getNextSequence(): Promise<number> {
    const today = this.getDateString();

    const lastDelivery = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.tracking_code LIKE :pattern', {
        pattern: `${this.PREFIX}-${today}-%`,
      })
      .orderBy('delivery.tracking_code', 'DESC')
      .getOne();

    if (!lastDelivery) {
      return 1;
    }

    const parsed = this.parseCode(lastDelivery.tracking_code);
    if (!parsed) {
      return 1;
    }

    return Number.parseInt(parsed.sequence, 10) + 1;
  }

  /**
   * Gera um código de rastreamento (sem garantia de unicidade)
   *
   * @returns Código de rastreamento gerado
   * @private
   */
  private async generateCode(): Promise<string> {
    const dateStr = this.getDateString();
    const nextSeq = await this.getNextSequence();
    const sequence = nextSeq.toString().padStart(this.SEQUENCE_LENGTH, '0');

    return `${this.PREFIX}-${dateStr}-${sequence}`;
  }

  /**
   * Obtém a data atual no formato YYYYMMDD
   *
   * @returns String com a data formatada
   * @private
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    return `${year}${month}${day}`;
  }

  /**
   * Formata um código de rastreamento para exibição
   *
   * @param code - Código de rastreamento
   * @returns Código formatado ou string vazia se inválido
   *
   * @example
   * ```typescript
   * const formatted = service.formatCode('NXT20240115-00001');
   * // Returns: "NXT-20240115-00001"
   * ```
   */
  formatCode(code: string): string {
    const parsed = this.parseCode(code);
    if (!parsed) {
      return '';
    }

    return `${parsed.prefix}-${parsed.date}-${parsed.sequence}`;
  }
}
