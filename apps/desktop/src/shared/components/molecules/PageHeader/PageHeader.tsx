/**
 * PageHeader Component
 * Header padrão para páginas da aplicação
 *
 * @example
 * <PageHeader
 *   title="Incidentes"
 *   description="Gerenciamento de incidentes operacionais"
 *   icon={AlertTriangle}
 *   iconColor="warning"
 *   actions={<Button>Nova Ação</Button>}
 * />
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageHeaderProps } from "./PageHeader.types";
import { pageHeaderStyles } from "./PageHeader.styles";

export const PageHeader = memo<PageHeaderProps>(function PageHeader({
  title,
  description,
  subtitle,
  icon: Icon,
  iconColor = "primary",
  actions,
  breadcrumbs,
}) {
  const displayDescription = description || subtitle;
  return (
    <div>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={pageHeaderStyles.breadcrumbs.container} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <div key={index} className="flex items-center gap-2">
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className={pageHeaderStyles.breadcrumbs.item}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? pageHeaderStyles.breadcrumbs.active
                        : pageHeaderStyles.breadcrumbs.item,
                    )}
                  >
                    {crumb.label}
                  </span>
                )}

                {!isLast && (
                  <ChevronRight
                    className={cn("w-4 h-4", pageHeaderStyles.breadcrumbs.separator)}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Header */}
      <div className={pageHeaderStyles.container}>
        <div className={pageHeaderStyles.leftSection}>
          {Icon && (
            <div
              className={cn(
                pageHeaderStyles.iconWrapper.base,
                pageHeaderStyles.iconWrapper.colors[iconColor],
              )}
            >
              <Icon
                className={cn("w-6 h-6", pageHeaderStyles.icon.colors[iconColor])}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          )}

          <div className={pageHeaderStyles.textContainer}>
            <h1 className={pageHeaderStyles.title}>{title}</h1>
            {displayDescription && (
              <p className={pageHeaderStyles.description}>{displayDescription}</p>
            )}
          </div>
        </div>

        {actions && <div className={pageHeaderStyles.actions}>{actions}</div>}
      </div>
    </div>
  );
});
