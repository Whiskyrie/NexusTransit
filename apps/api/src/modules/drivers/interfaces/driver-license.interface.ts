/**
 * Interface para dados de atualização de CNH
 * Usado no DriverLicenseService e DriversService
 */
export interface DriverLicenseUpdateData {
  license_number?: string;
  category?: string;
  expiration_date?: string;
  issuing_authority?: string;
  issuing_state?: string;
  is_active?: boolean;
}

/**
 * Interface para resposta de CNH do motorista
 */
export interface DriverLicenseResponse {
  id: string;
  license_number: string;
  category: string;
  issue_date: Date;
  expiration_date: Date;
  issuing_authority: string;
  issuing_state: string;
  is_active: boolean;
}
