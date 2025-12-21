import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { CepProvider, ProviderStats } from "../interfaces/cep-provider.interface";
import type { ViaCepAddress } from "../interfaces/viacep.interface";
import { ViaCepService } from "./viacep.service";
import { BrasilApiService } from "./brasilapi.service";
import { AwesomeApiService } from "./awesomeapi.service";

/**
 * Serviço orquestrador de consulta de CEP com fallback em cascata
 *
 * Tenta múltiplos provedores em ordem de prioridade até obter sucesso.
 * Implementa logging detalhado e coleta de métricas.
 */
@Injectable()
export class CepFallbackService {
  private readonly logger = new Logger(CepFallbackService.name);
  private readonly providers: CepProvider[];
  private readonly stats = new Map<string, ProviderStats>();

  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly brasilApiService: BrasilApiService,
    private readonly awesomeApiService: AwesomeApiService,
  ) {
    // Ordena provedores por prioridade (menor valor = maior prioridade)
    this.providers = [viaCepService, brasilApiService, awesomeApiService].sort(
      (a, b) => a.priority - b.priority,
    );

    this.logger.log(
      `Provedores configurados: ${this.providers.map((p) => `${p.name}(P${p.priority})`).join(", ")}`,
    );

    // Inicializa estatísticas
    this.providers.forEach((provider) => {
      this.stats.set(provider.name, {
        providerName: provider.name,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
      });
    });
  }

  /**
   * Consulta CEP com fallback automático entre provedores
   */
  async getAddressByZipCode(zipCode: string): Promise<ViaCepAddress> {
    // Validação rápida antes de tentar qualquer provedor
    if (!this.isValidZipCodeFormat(zipCode)) {
      throw new BadRequestException("CEP inválido. Deve conter exatamente 8 dígitos numéricos.");
    }

    const enabledProviders = this.providers.filter((p) => p.isEnabled());

    if (enabledProviders.length === 0) {
      this.logger.error("Nenhum provedor de CEP está habilitado!");
      throw new ServiceUnavailableException(
        "Serviço de consulta de CEP indisponível. Tente novamente mais tarde.",
      );
    }

    this.logger.log(
      `Iniciando consulta de CEP com ${enabledProviders.length} provedores disponíveis`,
    );

    const errors: Array<{ provider: string; error: Error }> = [];
    let lastNotFoundError: NotFoundException | null = null;

    for (const provider of enabledProviders) {
      const startTime = Date.now();

      try {
        this.logger.log(`Tentando provedor: ${provider.name} (Prioridade: ${provider.priority})`);

        const result = await provider.getAddressByZipCode(zipCode);
        const responseTime = Date.now() - startTime;

        this.updateStats(provider.name, true, responseTime);

        this.logger.log(`Sucesso com ${provider.name} em ${responseTime}ms`);

        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateStats(provider.name, false, responseTime);

        if (error instanceof NotFoundException) {
          // CEP não encontrado - armazena mas continua tentando
          lastNotFoundError = error;
          this.logger.warn(`${provider.name}: CEP não encontrado (${responseTime}ms)`);
          errors.push({ provider: provider.name, error });
          // Não tenta outros provedores se CEP não existe
          break;
        } else if (error instanceof BadRequestException) {
          // CEP inválido - não tenta outros provedores
          this.logger.warn(`${provider.name}: CEP inválido`);
          throw error;
        } else {
          // ServiceUnavailableException ou erro desconhecido - tenta próximo
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`${provider.name} indisponível (${responseTime}ms): ${errorMessage}`);
          errors.push({
            provider: provider.name,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          continue;
        }
      }
    }

    // Se chegou aqui, todos os provedores falharam
    this.logger.error(
      `Todos os provedores falharam. Erros: ${errors.map((e) => e.provider).join(", ")}`,
    );

    // Se o erro foi "não encontrado" em todos, retorna NotFoundException
    if (lastNotFoundError) {
      throw lastNotFoundError;
    }

    // Caso contrário, todos estavam indisponíveis
    throw new ServiceUnavailableException(
      "Todos os provedores de CEP estão temporariamente indisponíveis. " +
        "Tente novamente em alguns instantes.",
    );
  }

  /**
   * Valida formato básico do CEP antes de tentar provedores
   */
  private isValidZipCodeFormat(zipCode: string): boolean {
    if (!zipCode || typeof zipCode !== "string") {
      return false;
    }
    const cleaned = zipCode.replace(/\D/g, "");
    return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
  }

  /**
   * Atualiza estatísticas de uso do provedor
   */
  private updateStats(providerName: string, success: boolean, responseTime: number): void {
    const stats = this.stats.get(providerName);
    if (!stats) return;

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // Calcula média móvel do tempo de resposta
    const totalTime = stats.averageResponseTime * (stats.totalRequests - 1) + responseTime;
    stats.averageResponseTime = Math.round(totalTime / stats.totalRequests);
    stats.lastUsed = new Date();

    this.stats.set(providerName, stats);
  }

  /**
   * Retorna estatísticas de uso dos provedores
   * Útil para monitoramento e debugging
   */
  getProvidersStats(): ProviderStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Reseta estatísticas de todos os provedores
   */
  resetStats(): void {
    this.providers.forEach((provider) => {
      this.stats.set(provider.name, {
        providerName: provider.name,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
      });
    });
    this.logger.log("Estatísticas resetadas");
  }
}
