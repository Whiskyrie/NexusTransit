# GeoServices Package

Serviços de geolocalização e integração com APIs de mapas para o NexusTransit.

## Funcionalidades

- Consulta de endereços via ViaCEP
- Geocoding com Google Maps
- Cálculo de distâncias (Distance Matrix)
- Cálculo de rotas (Routes API)

## Instalação

```bash
pnpm install @nexustransit/geo-services
```

## Uso

### ViaCEP

```typescript
import { ViaCepService } from '@nexustransit/geo-services';

const viaCep = new ViaCepService();
const address = await viaCep.getAddressByZipCode('01001000');
```

### Google Maps

```typescript
import { GoogleMapsService } from '@nexustransit/geo-services';

const googleMaps = new GoogleMapsService(config);
const coordinates = await googleMaps.geocode('Rua XV de Novembro, 100');
```

## Configuração

Crie um arquivo de configuração:

```typescript
import { GeoServicesConfig } from '@nexustransit/geo-services';

export const geoServicesConfig: GeoServicesConfig = {
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    timeout: 5000
  },
  viaCep: {
    timeout: 3000
  }
};
```

## Variáveis de Ambiente

```env
GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

## Documentação das APIs

- [ViaCEP](https://viacep.com.br/)
- [Google Maps Platform](https://developers.google.com/maps)
