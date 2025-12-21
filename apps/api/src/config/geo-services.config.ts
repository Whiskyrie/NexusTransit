import { registerAs } from '@nestjs/config';

export default registerAs('geoServices', () => ({
  google: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    timeout: parseInt(process.env.GOOGLE_MAPS_TIMEOUT ?? '5000', 10),
  },
  viaCep: {
    timeout: parseInt(process.env.VIACEP_TIMEOUT ?? '3000', 10),
  },
}));
