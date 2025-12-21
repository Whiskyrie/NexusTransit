import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, TimeoutError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AxiosError } from "axios";
import type { AwesomeApiResponse } from "../interfaces/awesomeapi.interface";
import type { ViaCepAddress } from "../interfaces/viacep.interface";
import type { CepProvider } from "../interfaces/cep-provider.interface";
import { cleanCEP, formatCEP } from "../validators/cep.validator";

@Injectable()
export class AwesomeApiService implements CepProvider {
  readonly name = "AwesomeAPI";
  readonly priority = 3;
  readonly timeout = 3000;

  private readonly logger = new Logger(AwesomeApiService.name);
  private readonly baseUrl = "https://cep.awesomeapi.com.br/json";

  constructor(private readonly httpService: HttpService) {}

  async getAddressByZipCode(zipCode: string): Promise<ViaCepAddress> {
    if (!this.validateZipCode(zipCode)) {
      throw new BadRequestException("CEP inválido. Deve conter exatamente 8 dígitos numéricos.");
    }

    const cleanedZipCode = cleanCEP(zipCode);
    const url = `${this.baseUrl}/${cleanedZipCode}`;

    try {
      this.logger.log(`[AwesomeAPI] Consultando CEP: ${formatCEP(cleanedZipCode)}`);

      const { data } = await firstValueFrom(
        this.httpService
          .get<AwesomeApiResponse>(url, {
            timeout: this.timeout,
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.handleApiError(error, cleanedZipCode);
              throw error;
            }),
          ),
      );

      // AwesomeAPI retorna objeto com status quando há erro
      if ("status" in data && (data as { status?: number }).status === 400) {
        throw new NotFoundException("CEP não encontrado.");
      }

      this.logger.log(`[AwesomeAPI] Endereço encontrado: ${formatCEP(cleanedZipCode)}`);

      return this.mapToStandardFormat(data);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      if (error instanceof TimeoutError) {
        this.logger.error(`[AwesomeAPI] Timeout ao consultar CEP ${formatCEP(cleanedZipCode)}`);
        throw new ServiceUnavailableException("AwesomeAPI está demorando para responder.");
      }

      throw new ServiceUnavailableException("AwesomeAPI indisponível.");
    }
  }

  validateZipCode(zipCode: string): boolean {
    if (!zipCode) return false;
    const cleanedCep = cleanCEP(zipCode);
    return cleanedCep.length === 8 && /^\d{8}$/.test(cleanedCep);
  }

  isEnabled(): boolean {
    return process.env.CEP_AWESOMEAPI_ENABLED !== "false";
  }

  private handleApiError(error: AxiosError, cep: string): void {
    const status = error.response?.status;

    if (status === 404) {
      this.logger.warn(`[AwesomeAPI] CEP ${formatCEP(cep)} não encontrado`);
      throw new NotFoundException("CEP não encontrado.");
    }

    if (status && status >= 500) {
      this.logger.error(`[AwesomeAPI] Erro do servidor (${status}) para CEP ${formatCEP(cep)}`);
      throw new ServiceUnavailableException("AwesomeAPI temporariamente indisponível.");
    }
  }

  private mapToStandardFormat(data: AwesomeApiResponse): ViaCepAddress {
    return {
      zipCode: formatCEP(data.cep),
      street: data.address || "",
      complement: undefined,
      neighborhood: data.district || "",
      city: data.city,
      state: data.state,
      ibgeCode: data.city_ibge,
      ddd: data.ddd,
    };
  }
}
