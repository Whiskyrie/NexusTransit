export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export interface ViaCepAddress {
  zipCode: string;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCode?: string;
  ddd?: string;
}

export interface ViaCepServiceInterface {
  getAddressByZipCode(zipCode: string): Promise<ViaCepAddress>;
  validateZipCode(zipCode: string): boolean;
}
