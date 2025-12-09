import { CNHCategory } from '../enums/cnh-category.enum';

/**
 * Interface para dados de CNH
 */
export interface CNHData {
  license_number: string;
  category: CNHCategory;
  issue_date: Date;
  expiration_date: Date;
  issuing_authority: string;
  issuing_state: string;
}

/**
 * Interface para validação de CNH
 */
export interface CNHValidation {
  isValid: boolean;
  isExpired: boolean;
  daysToExpiration: number;
  categoryValid: boolean;
  requiredCategory?: CNHCategory;
  currentCategory: CNHCategory;
  warnings: string[];
  errors: string[];
}

/**
 * Interface para requisitos de CNH por tipo de operação
 */
export interface CNHRequirements {
  operation: string;
  minimumCategory: CNHCategory;
  allowedCategories: CNHCategory[];
  additionalRequirements?: string[];
}

/**
 * Mapa de categorias de CNH e suas capacidades
 */
export const CNH_CATEGORY_CAPABILITIES: Record<CNHCategory, string[]> = {
  [CNHCategory.A]: ['Motocicletas', 'Motonetas', 'Triciclos'],
  [CNHCategory.B]: ['Veículos até 3.500kg', 'Até 8 passageiros'],
  [CNHCategory.C]: ['Veículos de carga', 'Acima de 3.500kg'],
  [CNHCategory.D]: ['Transporte de passageiros', 'Mais de 8 passageiros'],
  [CNHCategory.E]: ['Veículos com reboque', 'Articulados'],
  [CNHCategory.AB]: ['Categoria A', 'Categoria B'],
  [CNHCategory.AC]: ['Categoria A', 'Categoria C'],
  [CNHCategory.AD]: ['Categoria A', 'Categoria D'],
  [CNHCategory.AE]: ['Categoria A', 'Categoria E'],
};
