import { ReactNode } from "react";

/**
 * Representa uma opção genérica do Select
 */
export interface SelectOption<T = string> {
  /** Valor único da opção */
  value: T;
  /** Texto exibido para a opção */
  label: string;
  /** Se a opção está desabilitada */
  disabled?: boolean;
  /** Ícone ou elemento visual opcional */
  icon?: ReactNode;
  /** Descrição adicional da opção */
  description?: string;
}

/**
 * Props do componente Select
 */
export interface SelectProps<T = string> {
  /** Array de opções disponíveis */
  options: SelectOption<T>[];
  /** Valor atualmente selecionado */
  value: T | undefined;
  /** Callback chamado quando o valor muda */
  onChange: (value: T) => void;
  /** Label do campo */
  label?: string;
  /** Texto exibido quando nenhuma opção está selecionada */
  placeholder?: string;
  /** Se o select está desabilitado */
  disabled?: boolean;
  /** Mensagem de erro */
  error?: string;
  /** Se usa o estilo compacto para formulários */
  compact?: boolean;
  /** Posição do dropdown: 'bottom' (padrão) ou 'top' */
  position?: "bottom" | "top";
  /** Classes CSS adicionais para o container */
  className?: string;
  /** Classes CSS adicionais para o botão trigger */
  buttonClassName?: string;
  /** ID do elemento para acessibilidade */
  id?: string;
  /** Nome do campo para formulários */
  name?: string;
  /** Se o campo é obrigatório */
  required?: boolean;
  /** Função para customizar a renderização das opções */
  renderOption?: (option: SelectOption<T>, selected: boolean) => ReactNode;
  /** Função para customizar a renderização do valor selecionado */
  renderValue?: (option: SelectOption<T>) => ReactNode;
}

/**
 * Props para o componente de opção individual
 */
export interface SelectOptionItemProps<T = string> {
  option: SelectOption<T>;
  renderOption?: SelectProps<T>["renderOption"];
}
