import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ViaCepService } from "./services/viacep.service";
import { GoogleMapsService } from "./services/google-maps.service";

@Global()
@Module({
  imports: [HttpModule],
  providers: [ViaCepService, GoogleMapsService],
  exports: [ViaCepService, GoogleMapsService],
})
export class GeoServicesModule {}
