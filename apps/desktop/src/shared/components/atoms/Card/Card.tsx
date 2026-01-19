/**
 * Card Component
 * Componente base para containers de conteúdo
 *
 * @example
 * <Card variant="elevated" padding="lg">
 *   <CardHeader title="Estatísticas" subtitle="Últimos 30 dias" />
 *   <CardBody>Conteúdo aqui</CardBody>
 *   <CardFooter>Ações aqui</CardFooter>
 * </Card>
 */

import { forwardRef, memo } from "react";
import { cn } from "@/lib/utils";
import type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from "./Card.types";
import { cardStyles, cardHeaderStyles, cardBodyStyles, cardFooterStyles } from "./Card.styles";

export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(function Card(
    {
      className,
      variant = "default",
      padding = "md",
      hoverable = false,
      clickable = false,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          cardStyles.base,
          cardStyles.variants[variant],
          cardStyles.padding[padding],
          hoverable && cardStyles.hoverable,
          clickable && cardStyles.clickable,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }),
);

Card.displayName = "Card";

export const CardHeader = memo<CardHeaderProps>(function CardHeader({
  className,
  title,
  subtitle,
  actions,
  ...props
}) {
  return (
    <div className={cn(cardHeaderStyles.base, className)} {...props}>
      <div className={cardHeaderStyles.titleContainer}>
        <h3 className={cardHeaderStyles.title}>{title}</h3>
        {subtitle && <p className={cardHeaderStyles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={cardHeaderStyles.actions}>{actions}</div>}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

export const CardBody = memo<CardBodyProps>(function CardBody({ className, children, ...props }) {
  return (
    <div className={cn(cardBodyStyles.base, className)} {...props}>
      {children}
    </div>
  );
});

CardBody.displayName = "CardBody";

export const CardFooter = memo<CardFooterProps>(function CardFooter({
  className,
  children,
  ...props
}) {
  return (
    <div className={cn(cardFooterStyles.base, className)} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";
