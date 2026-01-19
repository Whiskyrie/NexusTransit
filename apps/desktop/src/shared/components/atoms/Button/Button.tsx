/**
 * Button Component
 * Componente atômico para ações do usuário
 *
 * Features:
 * - 6 variants (primary, secondary, outline, ghost, danger, success)
 * - 3 sizes (sm, md, lg)
 * - Loading state com spinner
 * - Ícones left/right
 * - Full width option
 * - Acessibilidade completa
 *
 * @example
 * <Button variant="primary" leftIcon={Plus}>Criar Novo</Button>
 * <Button variant="danger" isLoading>Deletando...</Button>
 */

import { forwardRef, memo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "./Button.types";
import { buttonStyles } from "./Button.styles";

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          buttonStyles.base,
          buttonStyles.variants[variant],
          buttonStyles.sizes[size],
          fullWidth && buttonStyles.fullWidth,
          className,
        )}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {!isLoading && LeftIcon && <LeftIcon className="w-4 h-4" aria-hidden="true" />}
        {children}
        {!isLoading && RightIcon && <RightIcon className="w-4 h-4" aria-hidden="true" />}
      </button>
    );
  }),
);

Button.displayName = "Button";
