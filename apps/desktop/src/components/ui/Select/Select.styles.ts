import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário para merge de classes Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Estilos base do container
 */
export const containerStyles = "w-full";

/**
 * Estilos do label
 */
export const labelStyles = {
  default: "block text-sm font-medium text-[#1A1A1A] mb-2",
  compact: "block text-xs font-medium text-gray-700 mb-1.5",
};

/**
 * Estilos do botão trigger do Select
 */
export const buttonStyles = {
  base: cn(
    "relative w-full cursor-pointer bg-white",
    "text-left text-sm border transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/10",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50",
  ),
  normal: {
    default: "border-[#E5E7EB] hover:border-[#D1D5DB]",
    compact: "border-gray-200 hover:border-gray-300",
  },
  focus: {
    default: "border-[#1A1A1A] shadow-[0_0_0_3px_rgba(26,26,26,0.1)]",
    compact: "border-blue-500 ring-1 ring-blue-500",
  },
  error: {
    default: "border-[#EF4444] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
    compact: "border-red-300",
  },
  disabled: "border-[#E5E7EB] bg-gray-50",
  size: {
    default: "rounded-xl py-3.5 pl-4 pr-10",
    compact: "rounded-lg h-10 pl-3 pr-9",
  },
};

/**
 * Estilos do texto do valor selecionado
 */
export const valueStyles = {
  placeholder: "text-[#9CA3AF]",
  selected: "text-[#1A1A1A] truncate block",
};

/**
 * Estilos do ícone de seta
 */
export const chevronStyles = {
  default: cn(
    "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4",
    "text-[#9CA3AF]",
  ),
  compact: cn(
    "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3",
    "text-[#9CA3AF]",
  ),
};

/**
 * Estilos do dropdown de opções
 */
export const optionsContainerStyles = {
  base: cn(
    "absolute z-9999 max-h-80 w-full overflow-auto rounded-xl",
    "bg-white py-1 text-sm shadow-lg border border-gray-100",
    "ring-1 ring-black/5 focus:outline-none",
    // Animações suaves
    "transition duration-150 ease-out",
    "data-[open]:opacity-100",
  ),
  bottom: cn(
    "mt-1",
    "data-[closed]:opacity-0 data-[closed]:translate-y-[-4px]",
    "data-[open]:translate-y-0",
  ),
  top: cn(
    "bottom-full mb-1",
    "data-[closed]:opacity-0 data-[closed]:translate-y-[4px]",
    "data-[open]:translate-y-0",
  ),
};

/**
 * Estilos de uma opção individual
 */
export const optionStyles = {
  base: cn("relative cursor-pointer select-none py-3 pl-4 pr-10", "transition-colors duration-150"),
  active: "bg-[#F5F5F0]",
  selected: "font-medium text-[#1A1A1A]",
  normal: "text-gray-700",
  disabled: "cursor-not-allowed opacity-50 bg-gray-50",
};

/**
 * Estilos do ícone de check (opção selecionada)
 */
export const checkIconStyles = cn(
  "absolute inset-y-0 right-0 flex items-center pr-4 text-[#1A1A1A]",
);

/**
 * Estilos da mensagem de erro
 */
export const errorStyles = "text-xs text-[#EF4444] mt-1.5";

/**
 * Gera classes condicionais para o botão trigger
 */
export function getButtonClasses(
  hasError: boolean,
  isDisabled: boolean,
  isOpen: boolean,
  isCompact: boolean,
  className?: string,
): string {
  const sizeStyle = isCompact ? buttonStyles.size.compact : buttonStyles.size.default;
  const mode = isCompact ? "compact" : "default";

  let stateStyle: string;
  if (hasError) {
    stateStyle = buttonStyles.error[mode];
  } else if (isOpen) {
    stateStyle = buttonStyles.focus[mode];
  } else {
    stateStyle = buttonStyles.normal[mode];
  }

  return cn(
    buttonStyles.base,
    sizeStyle,
    stateStyle,
    isDisabled && buttonStyles.disabled,
    className,
  );
}

/**
 * Gera classes condicionais para uma opção
 */
export function getOptionClasses(
  isActive: boolean,
  isSelected: boolean,
  isDisabled: boolean,
): string {
  return cn(
    optionStyles.base,
    isActive && !isDisabled && optionStyles.active,
    isSelected ? optionStyles.selected : optionStyles.normal,
    isDisabled && optionStyles.disabled,
  );
}
