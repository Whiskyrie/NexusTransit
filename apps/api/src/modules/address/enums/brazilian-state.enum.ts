/**
 * Estados brasileiros (Unidades Federativas)
 *
 * Representa todos os 27 estados do Brasil
 */
export enum BrazilianState {
  AC = 'AC', // Acre
  AL = 'AL', // Alagoas
  AP = 'AP', // Amapá
  AM = 'AM', // Amazonas
  BA = 'BA', // Bahia
  CE = 'CE', // Ceará
  DF = 'DF', // Distrito Federal
  ES = 'ES', // Espírito Santo
  GO = 'GO', // Goiás
  MA = 'MA', // Maranhão
  MT = 'MT', // Mato Grosso
  MS = 'MS', // Mato Grosso do Sul
  MG = 'MG', // Minas Gerais
  PA = 'PA', // Pará
  PB = 'PB', // Paraíba
  PR = 'PR', // Paraná
  PE = 'PE', // Pernambuco
  PI = 'PI', // Piauí
  RJ = 'RJ', // Rio de Janeiro
  RN = 'RN', // Rio Grande do Norte
  RS = 'RS', // Rio Grande do Sul
  RO = 'RO', // Rondônia
  RR = 'RR', // Roraima
  SC = 'SC', // Santa Catarina
  SP = 'SP', // São Paulo
  SE = 'SE', // Sergipe
  TO = 'TO', // Tocantins
}

/**
 * Mapeamento de siglas para nomes completos dos estados
 */
export const BRAZILIAN_STATE_NAMES: Record<BrazilianState, string> = {
  [BrazilianState.AC]: 'Acre',
  [BrazilianState.AL]: 'Alagoas',
  [BrazilianState.AP]: 'Amapá',
  [BrazilianState.AM]: 'Amazonas',
  [BrazilianState.BA]: 'Bahia',
  [BrazilianState.CE]: 'Ceará',
  [BrazilianState.DF]: 'Distrito Federal',
  [BrazilianState.ES]: 'Espírito Santo',
  [BrazilianState.GO]: 'Goiás',
  [BrazilianState.MA]: 'Maranhão',
  [BrazilianState.MT]: 'Mato Grosso',
  [BrazilianState.MS]: 'Mato Grosso do Sul',
  [BrazilianState.MG]: 'Minas Gerais',
  [BrazilianState.PA]: 'Pará',
  [BrazilianState.PB]: 'Paraíba',
  [BrazilianState.PR]: 'Paraná',
  [BrazilianState.PE]: 'Pernambuco',
  [BrazilianState.PI]: 'Piauí',
  [BrazilianState.RJ]: 'Rio de Janeiro',
  [BrazilianState.RN]: 'Rio Grande do Norte',
  [BrazilianState.RS]: 'Rio Grande do Sul',
  [BrazilianState.RO]: 'Rondônia',
  [BrazilianState.RR]: 'Roraima',
  [BrazilianState.SC]: 'Santa Catarina',
  [BrazilianState.SP]: 'São Paulo',
  [BrazilianState.SE]: 'Sergipe',
  [BrazilianState.TO]: 'Tocantins',
};

/**
 * Mapeamento de regiões do Brasil
 */
export const BRAZILIAN_REGIONS = {
  NORTE: [
    BrazilianState.AC,
    BrazilianState.AP,
    BrazilianState.AM,
    BrazilianState.PA,
    BrazilianState.RO,
    BrazilianState.RR,
    BrazilianState.TO,
  ],
  NORDESTE: [
    BrazilianState.AL,
    BrazilianState.BA,
    BrazilianState.CE,
    BrazilianState.MA,
    BrazilianState.PB,
    BrazilianState.PE,
    BrazilianState.PI,
    BrazilianState.RN,
    BrazilianState.SE,
  ],
  CENTRO_OESTE: [BrazilianState.DF, BrazilianState.GO, BrazilianState.MT, BrazilianState.MS],
  SUDESTE: [BrazilianState.ES, BrazilianState.MG, BrazilianState.RJ, BrazilianState.SP],
  SUL: [BrazilianState.PR, BrazilianState.RS, BrazilianState.SC],
} as const;

/**
 * Utilitário para validar sigla de estado
 */
export function isValidBrazilianState(state: string): state is BrazilianState {
  return Object.values(BrazilianState).includes(state as BrazilianState);
}

/**
 * Utilitário para obter estados disponíveis
 */
export function getAvailableBrazilianStates(): BrazilianState[] {
  return Object.values(BrazilianState);
}

/**
 * Utilitário para traduzir sigla do estado
 */
export function translateBrazilianState(state: BrazilianState): string {
  return BRAZILIAN_STATE_NAMES[state] || state;
}

/**
 * Utilitário para normalizar sigla de estado
 */
export function normalizeBrazilianState(state: string): BrazilianState | null {
  const normalized = state.trim().toUpperCase();
  return isValidBrazilianState(normalized) ? normalized : null;
}

/**
 * Utilitário para obter região do estado
 */
export function getBrazilianStateRegion(
  state: BrazilianState,
): keyof typeof BRAZILIAN_REGIONS | null {
  for (const [region, states] of Object.entries(BRAZILIAN_REGIONS) as [
    keyof typeof BRAZILIAN_REGIONS,
    readonly BrazilianState[],
  ][]) {
    if (states.includes(state)) {
      return region;
    }
  }
  return null;
}

/**
 * Utilitário para obter estados de uma região
 */
export function getStatesByRegion(region: keyof typeof BRAZILIAN_REGIONS): BrazilianState[] {
  return [...BRAZILIAN_REGIONS[region]];
}
