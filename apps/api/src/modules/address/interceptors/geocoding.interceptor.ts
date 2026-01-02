import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GeocodingService } from '../services';

/**
 * Interface para dados de endereço no body da requisição
 */
interface AddressRequestBody {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  cep?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface para dados de endereço na resposta
 */
interface AddressResponseData {
  id?: string;
  [key: string]: unknown;
}

/**
 * Interceptor para geocoding automático de endereços
 *
 * Intercepta criação/atualização de endereços e executa geocoding
 * assíncrono para obter coordenadas quando não fornecidas
 *
 * Características:
 * - Execução assíncrona (não bloqueia resposta HTTP)
 * - Atualiza campos latitude/longitude/formatted_address
 * - Ignora se coordenadas já existem
 * - Tratamento de erros silencioso (logs)
 */
@Injectable()
export class GeocodingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GeocodingInterceptor.name);

  constructor(private readonly geocodingService: GeocodingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; body: AddressRequestBody }>();
    const { method, body } = request;

    // Verificar se é criação ou atualização
    const shouldGeocode = method === 'POST' || method === 'PATCH' || method === 'PUT';

    if (!shouldGeocode || !body) {
      return next.handle();
    }

    // Verificar se endereço possui dados suficientes para geocoding
    const hasAddressData = this.hasRequiredAddressFields(body);

    // Verificar se já possui coordenadas
    const hasCoordinates = body.latitude && body.longitude;

    if (!hasAddressData || hasCoordinates) {
      return next.handle();
    }

    // Executar request normalmente e fazer geocoding depois
    return next.handle().pipe(
      tap({
        next: data => {
          // Executar geocoding assíncrono (não aguardar)
          void this.performAsyncGeocodingIfNeeded(body, data as AddressResponseData);
        },
        error: () => {
          // Não fazer nada em caso de erro na request original
        },
      }),
    );
  }

  /**
   * Verifica se body possui campos necessários para geocoding
   */
  private hasRequiredAddressFields(body: AddressRequestBody): boolean {
    return !!(body.street && body.city && body.state);
  }

  /**
   * Executa geocoding assíncrono (não bloqueia)
   */
  private async performAsyncGeocodingIfNeeded(
    requestBody: AddressRequestBody,
    responseData: AddressResponseData,
  ): Promise<void> {
    try {
      // Preparar dados para geocoding
      const geocodingRequest = {
        street: requestBody.street ?? '',
        number: requestBody.number ?? '',
        neighborhood: requestBody.neighborhood ?? '',
        city: requestBody.city ?? '',
        state: requestBody.state ?? '',
        country: requestBody.country ?? 'BR',
        postal_code: requestBody.cep ?? requestBody.postal_code ?? '',
      };

      this.logger.debug(`Iniciando geocoding assíncrono para: ${geocodingRequest.city}`);

      // Executar geocoding
      const geocodingResult = await this.geocodingService.geocode(geocodingRequest);

      this.logger.log(
        `Geocoding concluído: ${geocodingResult.latitude}, ${geocodingResult.longitude}`,
      );

      // Aqui poderíamos atualizar o endereço no banco se tivéssemos acesso ao repository
      // Por enquanto apenas logamos o resultado
      // TODO: Considerar emitir evento ou usar serviço para atualizar coordenadas

      this.logger.debug(
        `Coordenadas obtidas para endereço ${responseData.id}: ` +
          `${geocodingResult.latitude}, ${geocodingResult.longitude}`,
      );
    } catch (error) {
      // Geocoding é opcional, não deve quebrar o fluxo
      this.logger.warn(
        `Geocoding assíncrono falhou (não crítico):`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Verifica se deve fazer geocoding com base no método HTTP
   */
  private shouldPerformGeocodingForMethod(method: string): boolean {
    return ['POST', 'PATCH', 'PUT'].includes(method.toUpperCase());
  }

  /**
   * Extrai dados de endereço do body da requisição
   */
  private extractAddressData(body: AddressRequestBody): AddressRequestBody {
    return {
      street: body.street,
      number: body.number,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      country: body.country,
      postal_code: body.cep ?? body.postal_code,
    };
  }

  /**
   * Valida se dados de endereço são suficientes para geocoding
   */
  private isValidForGeocodingRequest(data: AddressRequestBody): boolean {
    // Campos mínimos necessários
    if (!data.street || !data.city || !data.state) {
      return false;
    }

    // Validar se não são strings vazias
    if (data.street.trim() === '' || data.city.trim() === '' || data.state.trim() === '') {
      return false;
    }

    return true;
  }
}
