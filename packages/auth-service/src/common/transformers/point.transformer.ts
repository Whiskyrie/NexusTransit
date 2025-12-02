import type { ValueTransformer } from 'typeorm';

/**
 * Transformer para tipo POINT do PostgreSQL
 *
 * Converte entre formatos:
 * - String no código: "POINT(-23.561414 -46.656250)" ou "(-23.561414,-46.656250)"
 * - Formato do banco: (-23.561414,-46.656250)
 */
export const PointTransformer: ValueTransformer = {
  /**
   * Converte do formato do banco para o código
   * Banco: "(x,y)" -> Código: "(x,y)"
   */
  from(value: string | null): string | null {
    if (!value) {
      return null;
    }
    // Se já veio no formato (x,y), retorna direto
    return value;
  },

  /**
   * Converte do código para o formato do banco
   * Código: "POINT(x y)" ou "(x,y)" -> Banco: "(x,y)"
   */
  to(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    // Se vier no formato "POINT(x y)" ou "POINT(x, y)"
    if (value.toUpperCase().startsWith('POINT')) {
      // Extrair coordenadas: POINT(-23.561414 -46.656250)
      const match = /POINT\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)/i.exec(value);
      if (match) {
        const [, x, y] = match;
        return `(${x},${y})`;
      }
    }

    // Se vier no formato "(x, y)" ou "(x,y)"
    if (value.startsWith('(') && value.endsWith(')')) {
      // Remover espaços após vírgula se houver
      return value.replace(/,\s+/, ',');
    }

    // Se vier no formato "x,y" sem parênteses
    if (value.includes(',')) {
      return `(${value.replace(/\s+/, '')})`;
    }

    // Formato inválido, retornar null
    return null;
  },
};

/**
 * Converte coordenadas para formato WKT (Well-Known Text)
 * Útil para queries espaciais com PostGIS
 */
export function toWKT(point: string): string | null {
  if (!point) {
    return null;
  }

  // Se já estiver no formato POINT(x y)
  if (point.toUpperCase().startsWith('POINT')) {
    return point;
  }

  // Se estiver no formato (x,y)
  if (point.startsWith('(') && point.endsWith(')')) {
    const coords = point.slice(1, -1).split(',');
    if (coords.length === 2) {
      return `POINT(${coords[0]} ${coords[1]})`;
    }
  }

  return null;
}

/**
 * Extrai latitude de um point
 */
export function getLatitude(point: string): number | null {
  if (!point) {
    return null;
  }

  // POINT(x y)
  if (point.toUpperCase().startsWith('POINT')) {
    const match = /POINT\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)/i.exec(point);
    if (match?.[1]) {
      return parseFloat(match[1]);
    }
  }

  // (x,y)
  if (point.startsWith('(') && point.endsWith(')')) {
    const coords = point.slice(1, -1).split(',');
    if (coords.length === 2 && coords[0]) {
      return parseFloat(coords[0]);
    }
  }

  return null;
}

/**
 * Extrai longitude de um point
 */
export function getLongitude(point: string): number | null {
  if (!point) {
    return null;
  }

  // POINT(x y)
  if (point.toUpperCase().startsWith('POINT')) {
    const match = /POINT\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)/i.exec(point);
    if (match?.[2]) {
      return parseFloat(match[2]);
    }
  }

  // (x,y)
  if (point.startsWith('(') && point.endsWith(')')) {
    const coords = point.slice(1, -1).split(',');
    if (coords.length === 2 && coords[1]) {
      return parseFloat(coords[1]);
    }
  }

  return null;
}
export * from './point.transformer';
