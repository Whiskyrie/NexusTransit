import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ViaCepService } from "./services/viacep.service";
import { BrasilApiService } from "./services/brasilapi.service";
import { AwesomeApiService } from "./services/awesomeapi.service";
import { CepFallbackService } from "./services/cep-fallback.service";
import { GoogleMapsService } from "./services/google-maps.service";

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    // Provedores individuais de CEP
    ViaCepService,
    BrasilApiService,
    AwesomeApiService,

    // Orquestrador de fallback
    CepFallbackService,

    // Outros serviços
    GoogleMapsService,
  ],
  exports: [
    // Exporta o orquestrador como serviço principal
    CepFallbackService,

    // Mantém ViaCepService exportado para compatibilidade
    ViaCepService,

    // Outros serviços
    GoogleMapsService,
  ],
})
export class GeoServicesModule {}
