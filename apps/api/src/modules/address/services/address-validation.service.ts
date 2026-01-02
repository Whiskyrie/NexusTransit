import { Injectable, Logger } from '@nestjs/common';
import { CepLookupService } from './cep-lookup.service';
import { AddressFormatterUtil } from '../utils';
import { IAddressValidation, ICepData } from '../interfaces';
import { InvalidCepException, InvalidBrazilianStateException } from '../exceptions';
import { isValidBrazilianState } from '../enums';

/**
 * Serviço de validação e normalização de endereços
 *
 * Responsável por:
 * - Validar se endereço existe via API de CEP
 * - Normalizar dados retornados
 * - Preencher campos automaticamente a partir do CEP
 * - Validar coordenadas
 */
@Injectable()
export class AddressValidationService {
  private readonly logger = new Logger(AddressValidationService.name);

  constructor(private readonly cepLookupService: CepLookupService) {}

  /**
   * Valida endereço completo
   */
  validateAddress(address: {
    cep?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  }): IAddressValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar CEP se fornecido
    if (address.cep) {
      try {
        this.validateCepOrThrow(address.cep);
      } catch (error) {
        if (error instanceof InvalidCepException) {
          errors.push(error.message);
        }
      }
    }

    // Validar estado
    if (address.state) {
      try {
        this.validateStateOrThrow(address.state);
      } catch (error) {
        if (error instanceof InvalidBrazilianStateException) {
          errors.push(error.message);
        }
      }
    }

    // Validar campos obrigatórios
    if (!address.street) {
      errors.push('Logradouro é obrigatório');
    }

    if (!address.neighborhood) {
      errors.push('Bairro é obrigatório');
    }

    if (!address.city) {
      errors.push('Cidade é obrigatória');
    }

    if (!address.state) {
      errors.push('Estado é obrigatório');
    }

    // Validar coordenadas se fornecidas
    if (address.latitude !== undefined || address.longitude !== undefined) {
      if (address.latitude === undefined || address.longitude === undefined) {
        errors.push('Latitude e longitude devem ser fornecidas juntas');
      } else {
        const coordsValidation = this.validateCoordinates(address.latitude, address.longitude);
        if (!coordsValidation.isValid) {
          errors.push(...(coordsValidation.errors ?? []));
        }
      }
    }

    // Warnings
    if (!address.number) {
      warnings.push('Número do endereço não informado');
    }

    if (!address.cep) {
      warnings.push('CEP não informado - recomendado para melhor precisão');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Preenche endereço automaticamente a partir do CEP
   */
  async autocompleteFromCep(cep: string): Promise<ICepData> {
    this.logger.log(`Autocompletando endereço a partir do CEP: ${cep}`);

    try {
      const cepData = await this.cepLookupService.lookupCep(cep);

      this.logger.debug(`Endereço encontrado: ${cepData.city}/${cepData.state}`);

      return cepData;
    } catch (error) {
      this.logger.error(`Erro ao autocompleter endereço:`, error);
      throw error;
    }
  }

  /**
   * Verifica se endereço possui coordenadas válidas
   */
  hasValidCoordinates(address: { latitude?: number; longitude?: number }): boolean {
    if (!address.latitude || !address.longitude) {
      return false;
    }

    return AddressFormatterUtil.validateCoordinates(address.latitude, address.longitude);
  }

  /**
   * Valida formato de CEP e lança exception se inválido
   */
  private validateCepOrThrow(cep: string): void {
    const normalized = AddressFormatterUtil.normalizeCep(cep);

    if (!/^\d{8}$/.test(normalized)) {
      throw new InvalidCepException(cep, 'CEP deve conter exatamente 8 dígitos numéricos');
    }

    // Verificar CEPs inválidos conhecidos
    if (/^(\d)\1{7}$/.test(normalized)) {
      throw new InvalidCepException(cep, 'CEP inválido - sequência repetida');
    }

    // Validar range (CEPs válidos começam a partir de 01000-000)
    const cepNumber = parseInt(normalized, 10);
    if (cepNumber < 1000000 || cepNumber > 99999999) {
      throw new InvalidCepException(cep, 'CEP fora do range válido');
    }
  }

  /**
   * Valida estado brasileiro e lança exception se inválido
   */
  private validateStateOrThrow(state: string): void {
    const normalized = state.trim().toUpperCase();

    if (normalized.length !== 2) {
      throw new InvalidBrazilianStateException(state);
    }

    if (!isValidBrazilianState(normalized)) {
      throw new InvalidBrazilianStateException(state);
    }
  }

  /**
   * Valida coordenadas geográficas
   */
  private validateCoordinates(latitude: number, longitude: number): IAddressValidation {
    const errors: string[] = [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      errors.push('Latitude e longitude devem ser números');
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      errors.push('Latitude e longitude devem ser números válidos');
    }

    if (latitude < -90 || latitude > 90) {
      errors.push('Latitude deve estar entre -90 e 90');
    }

    if (longitude < -180 || longitude > 180) {
      errors.push('Longitude deve estar entre -180 e 180');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Verifica se endereço possui todas as informações necessárias
   */
  isCompleteAddress(address: {
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }): boolean {
    return !!(address.street && address.neighborhood && address.city && address.state);
  }
}
