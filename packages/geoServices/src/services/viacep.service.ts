import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import type {
  ViaCepResponse,
  ViaCepAddress,
  ViaCepServiceInterface,
} from "../interfaces/viacep.interface";
import { cleanCEP, formatCEP } from "../validators/cep.validator";

@Injectable()
export class ViaCepService implements ViaCepServiceInterface {
  private readonly logger = new Logger(ViaCepService.name);
  private readonly baseUrl = "https://viacep.com.br/ws";
  private readonly timeout = 3000;

  constructor(private readonly httpService: HttpService) {}

  async getAddressByZipCode(zipCode: string): Promise<ViaCepAddress> {
    // Valida o CEP
    if (!this.validateZipCode(zipCode)) {
      throw new BadRequestException("CEP inválido. Deve conter exatamente 8 dígitos numéricos.");
    }

    const cleanedZipCode = cleanCEP(zipCode);
    const url = `${this.baseUrl}/${cleanedZipCode}/json/`;

    try {
      this.logger.log(`Consultando ViaCEP para o CEP: ${formatCEP(cleanedZipCode)}`);

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

      this.logger.log(`Endereço encontrado para o CEP ${formatCEP(cleanedZipCode)}`);

      return address;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      this.logger.error(
        `Erro ao consultar ViaCEP para o CEP ${formatCEP(cleanedZipCode)}: ${errorMessage}`,
      );

      throw new NotFoundException("Não foi possível consultar o CEP. Tente novamente mais tarde.");
    }
  }

  validateZipCode(zipCode: string): boolean {
    if (!zipCode) {
      return false;
    }

    const cleanedCep = cleanCEP(zipCode);
    return cleanedCep.length === 8 && /^\d{8}$/.test(cleanedCep);
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
