import { Injectable, Logger } from '@nestjs/common';
import { CepFallbackService } from '@nexus/geo-services';
import { RedisService } from '@nexus/redis';
import { CACHE_KEYS, CACHE_TTL } from '../constants';
import {
  CepNotFoundException,
  CepApiUnavailableException,
  InvalidCepException,
  InvalidBrazilianStateException,
} from '../exceptions';
import { ICepData } from '../interfaces';
import { AddressFormatterUtil } from '../utils';

/**
 * Serviço de consulta de CEP com cache e tratamento de erros
 *
 * Wrapper do CepFallbackService com:
 * - Cache com Redis
 * - Tratamento de erros padronizado
 * - Normalização de dados
 * - Retorno em formato padronizado
 */
@Injectable()
export class CepLookupService {
  private readonly logger = new Logger(CepLookupService.name);

  constructor(
    private readonly cepFallbackService: CepFallbackService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Busca endereço por CEP com cache
   */
  async lookupCep(cep: string): Promise<ICepData> {
    // Normalizar CEP
    const normalizedCep = AddressFormatterUtil.normalizeCep(cep);

    // Validar formato
    if (!this.isValidCepFormat(normalizedCep)) {
      throw new InvalidCepException(cep, 'CEP deve conter exatamente 8 dígitos numéricos');
    }

    // Verificar cache
    const cached = await this.getCachedCep(normalizedCep);
    if (cached) {
      this.logger.debug(`CEP ${normalizedCep} encontrado no cache`);
      return cached;
    }

    // Buscar na API
    this.logger.log(`Buscando CEP ${normalizedCep} nas APIs externas`);

    try {
      const result = await this.cepFallbackService.getAddressByZipCode(normalizedCep);

      // Mapear para formato padronizado
      const cepData = this.mapToCepData(result, normalizedCep);

      // Salvar no cache
      await this.cacheCep(normalizedCep, cepData);

      return cepData;
    } catch (error) {
      this.logger.error(`Erro ao buscar CEP ${normalizedCep}:`, error);

      if (error instanceof Error) {
        if (error.message.includes('não encontrado') || error.message.includes('not found')) {
          throw new CepNotFoundException(normalizedCep);
        }

        if (
          error.message.includes('indisponível') ||
          error.message.includes('unavailable') ||
          error.message.includes('timeout')
        ) {
          throw new CepApiUnavailableException(error.message);
        }
      }

      throw new CepApiUnavailableException();
    }
  }

  /**
   * Valida múltiplos CEPs em lote
   */
  async validateCeps(ceps: string[]): Promise<Map<string, ICepData | Error>> {
    const results = new Map<string, ICepData | Error>();

    await Promise.allSettled(
      ceps.map(async cep => {
        try {
          const data = await this.lookupCep(cep);
          results.set(cep, data);
        } catch (error) {
          results.set(cep, error as Error);
        }
      }),
    );

    return results;
  }

  /**
   * Limpa cache de um CEP específico
   */
  async clearCepCache(cep: string): Promise<void> {
    const normalizedCep = AddressFormatterUtil.normalizeCep(cep);
    const cacheKey = this.getCacheKey(normalizedCep);
    await this.redisService.delete(cacheKey);
    this.logger.debug(`Cache do CEP ${normalizedCep} removido`);
  }

  /**
   * Busca CEP no cache
   */
  private async getCachedCep(cep: string): Promise<ICepData | null> {
    try {
      const cacheKey = this.getCacheKey(cep);
      const cached = await this.redisService.get<ICepData>(cacheKey);
      return cached ?? null;
    } catch (error) {
      this.logger.warn(`Erro ao buscar CEP no cache:`, error);
      return null;
    }
  }

  /**
   * Salva CEP no cache
   */
  private async cacheCep(cep: string, data: ICepData): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(cep);
      await this.redisService.set(cacheKey, data, CACHE_TTL.CEP_LOOKUP);
      this.logger.debug(`CEP ${cep} salvo no cache por ${CACHE_TTL.CEP_LOOKUP}s`);
    } catch (error) {
      this.logger.warn(`Erro ao salvar CEP no cache:`, error);
    }
  }

  /**
   * Gera chave de cache para CEP
   */
  private getCacheKey(cep: string): string {
    return `${CACHE_KEYS.CEP_LOOKUP}${cep}`;
  }

  /**
   * Valida formato do CEP
   */
  private isValidCepFormat(cep: string): boolean {
    return /^\d{8}$/.test(cep);
  }

  /**
   * Mapeia resposta da API para formato padronizado
   */
  private mapToCepData(
    data: {
      zipCode: string;
      street: string;
      neighborhood: string;
      city: string;
      state: string;
      ibgeCode?: string;
      ddd?: string;
    },
    normalizedCep: string,
  ): ICepData {
    const state = AddressFormatterUtil.normalizeState(data.state);

    if (!state) {
      throw new InvalidBrazilianStateException(data.state);
    }

    return {
      cep: AddressFormatterUtil.formatCep(normalizedCep),
      street: AddressFormatterUtil.capitalizeWords(data.street),
      neighborhood: AddressFormatterUtil.capitalizeWords(data.neighborhood),
      city: AddressFormatterUtil.normalizeCityName(data.city),
      state,
      ibge_code: data.ibgeCode,
      ddd: data.ddd,
    };
  }
}
