import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable()
export class ViaCepService {
  constructor(private readonly httpService: HttpService) {}

  async validateAndFetchAddress(cep: string): Promise<Partial<ViaCepResponse>> {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      throw new BadRequestException('CEP deve ter 8 dígitos');
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ViaCepResponse>(`https://viacep.com.br/ws/${cleanCep}/json/`),
      );

      if (data.erro) {
        throw new BadRequestException('CEP não encontrado');
      }

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao consultar CEP. Tente novamente.');
    }
  }

  async fetchAddressByCep(cep: string): Promise<Partial<ViaCepResponse>> {
    return this.validateAndFetchAddress(cep);
  }
}
