import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, TimeoutError } from "rxjs";
import { AxiosError } from "axios";
import type {
  ViaCepResponse,
  ViaCepAddress,
  ViaCepServiceInterface,
} from "../interfaces/viacep.interface";
import type { CepProvider } from "../interfaces/cep-provider.interface";
import { cleanCEP, formatCEP } from "../validators/cep.validator";

@Injectable()
export class ViaCepService implements ViaCepServiceInterface, CepProvider {
  readonly name = "ViaCEP";
  readonly priority = 1;
  readonly timeout = 3000;

  private readonly logger = new Logger(ViaCepService.name);
  private readonly baseUrl = "https://viacep.com.br/ws";

  constructor(private readonly httpService: HttpService) {}

  async getAddressByZipCode(zipCode: string): Promise<ViaCepAddress> {
    // Valida o CEP
    if (!this.validateZipCode(zipCode)) {
      throw new BadRequestException("CEP inválido. Deve conter exatamente 8 dígitos numéricos.");
    }

    const cleanedZipCode = cleanCEP(zipCode);
    const url = `${this.baseUrl}/${cleanedZipCode}/json/`;

    try {
      this.logger.log(`[ViaCEP] Consultando CEP: ${formatCEP(cleanedZipCode)}`);

      const response = await firstValueFrom(
        this.httpService.get<ViaCepResponse>(url, {
          timeout: this.timeout,
        }),
      );

      const data = response.data;

      // Verifica se houve erro na resposta
      if (data.erro) {
        throw new NotFoundException("CEP não encontrado.");
      }

      // Mapeia a resposta para o formato padrão
      const address: ViaCepAddress = {
        zipCode: formatCEP(data.cep),
        street: data.logradouro,
        complement: data.complemento || undefined,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        ibgeCode: data.ibge || undefined,
        ddd: data.ddd || undefined,
      };

      this.logger.log(`[ViaCEP] Endereço encontrado: ${formatCEP(cleanedZipCode)}`);

      return address;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      // Verifica se é erro de timeout
      if (error instanceof TimeoutError) {
        this.logger.error(`[ViaCEP] Timeout ao consultar CEP ${formatCEP(cleanedZipCode)}`);
        throw new ServiceUnavailableException(
          "O serviço de consulta de CEP está demorando para responder. Tente novamente.",
        );
      }

      // Verifica se é erro HTTP (5xx = servidor, 4xx = cliente)
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        if (status && status >= 500) {
          this.logger.error(
            `[ViaCEP] Indisponível (${status}) para o CEP ${formatCEP(cleanedZipCode)}: ${errorMessage}`,
          );
          throw new ServiceUnavailableException(
            "O serviço de consulta de CEP está temporariamente indisponível. Tente novamente em alguns instantes.",
          );
        }
      }

      // Para outros erros não identificados
      this.logger.error(
        `[ViaCEP] Erro ao consultar CEP ${formatCEP(cleanedZipCode)}: ${errorMessage}`,
      );

      throw new ServiceUnavailableException(
        "Não foi possível consultar o CEP. Tente novamente mais tarde.",
      );
    }
  }

  validateZipCode(zipCode: string): boolean {
    if (!zipCode) {
      return false;
    }

    const cleanedCep = cleanCEP(zipCode);
    return cleanedCep.length === 8 && /^\d{8}$/.test(cleanedCep);
  }

  isEnabled(): boolean {
    return process.env.CEP_VIACEP_ENABLED !== "false";
  }

  async getAddressByZipCodeWithFallback(
    zipCode: string,
    fallbackAddress?: Partial<ViaCepAddress>,
  ): Promise<ViaCepAddress> {
    try {
      return await this.getAddressByZipCode(zipCode);
    } catch (error) {
      if (error instanceof NotFoundException && fallbackAddress) {
        this.logger.warn(`CEP ${formatCEP(zipCode)} não encontrado. Usando endereço de fallback.`);

        return {
          zipCode: formatCEP(zipCode),
          street: fallbackAddress.street ?? "Não informado",
          complement: fallbackAddress.complement,
          neighborhood: fallbackAddress.neighborhood ?? "Não informado",
          city: fallbackAddress.city ?? "Não informado",
          state: fallbackAddress.state ?? "XX",
          ibgeCode: fallbackAddress.ibgeCode,
          ddd: fallbackAddress.ddd,
        };
      }

      throw error;
    }
  }
}
