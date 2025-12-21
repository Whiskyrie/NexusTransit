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
import type { BrasilApiResponse } from "../interfaces/brasilapi.interface";
import type { ViaCepAddress } from "../interfaces/viacep.interface";
import type { CepProvider } from "../interfaces/cep-provider.interface";
import { cleanCEP, formatCEP } from "../validators/cep.validator";

@Injectable()
export class BrasilApiService implements CepProvider {
  readonly name = "BrasilAPI";
  readonly priority = 2;
  readonly timeout = 3000;

  private readonly logger = new Logger(BrasilApiService.name);
  private readonly baseUrl = "https://brasilapi.com.br/api/cep/v2";

  constructor(private readonly httpService: HttpService) {}

  async getAddressByZipCode(zipCode: string): Promise<ViaCepAddress> {
    if (!this.validateZipCode(zipCode)) {
      throw new BadRequestException("CEP inválido. Deve conter exatamente 8 dígitos numéricos.");
    }

    const cleanedZipCode = cleanCEP(zipCode);
    const url = `${this.baseUrl}/${cleanedZipCode}`;

    try {
      this.logger.log(`[BrasilAPI] Consultando CEP: ${formatCEP(cleanedZipCode)}`);

      const { data } = await firstValueFrom(
        this.httpService
          .get<BrasilApiResponse>(url, {
            timeout: this.timeout,
            headers: { "User-Agent": "NexusTransit/1.0" },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.handleApiError(error, cleanedZipCode);
              throw error;
            }),
          ),
      );

      this.logger.log(`[BrasilAPI] Endereço encontrado: ${formatCEP(cleanedZipCode)}`);

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
        this.logger.error(`[BrasilAPI] Timeout ao consultar CEP ${formatCEP(cleanedZipCode)}`);
        throw new ServiceUnavailableException(
          "BrasilAPI está demorando para responder. Tentando próximo provedor.",
        );
      }

      throw new ServiceUnavailableException("BrasilAPI indisponível.");
    }
  }

  validateZipCode(zipCode: string): boolean {
    if (!zipCode) return false;
    const cleanedCep = cleanCEP(zipCode);
    return cleanedCep.length === 8 && /^\d{8}$/.test(cleanedCep);
  }

  isEnabled(): boolean {
    return process.env.CEP_BRASILAPI_ENABLED !== "false";
  }

  private handleApiError(error: AxiosError, cep: string): void {
    const status = error.response?.status;

    if (status === 404) {
      this.logger.warn(`[BrasilAPI] CEP ${formatCEP(cep)} não encontrado`);
      throw new NotFoundException("CEP não encontrado.");
    }

    if (status && status >= 500) {
      this.logger.error(`[BrasilAPI] Erro do servidor (${status}) para CEP ${formatCEP(cep)}`);
      throw new ServiceUnavailableException("BrasilAPI temporariamente indisponível.");
    }

    if (status === 400) {
      throw new BadRequestException("CEP inválido segundo BrasilAPI.");
    }
  }

  private mapToStandardFormat(data: BrasilApiResponse): ViaCepAddress {
    return {
      zipCode: formatCEP(data.cep),
      street: data.street || "",
      complement: undefined,
      neighborhood: data.neighborhood || "",
      city: data.city,
      state: data.state,
      ibgeCode: undefined,
      ddd: undefined,
    };
  }
}
