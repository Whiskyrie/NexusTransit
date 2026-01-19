/**
 * CollapsibleSection Component Types
 * Seção colapsável para sidebar
 */

import type { ReactNode } from "react";

export interface CollapsibleSectionProps {
  /**
   * Título da seção
   */
  title: string;

  /**
   * Se a seção começa aberta
   * @default true
   */
  defaultOpen?: boolean;

  /**
   * Conteúdo da seção
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais
   */
  className?: string;
}
