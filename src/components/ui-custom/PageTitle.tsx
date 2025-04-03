
import React from 'react';
import { cn } from '@/lib/utils';

type PageTitleProps = {
  title: string;
  subtitle?: string;
  className?: string;
  breadcrumbs?: Array<{
    label: string;
    url: string;
  }>;
};

const PageTitle = ({ title, subtitle, className, breadcrumbs }: PageTitleProps) => {
  return (
    <div className={cn("mb-8 animate-slideInFromBottom", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              <a href={crumb.url} className="hover:text-primary transition-colors">
                {crumb.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      )}
      <h1 className="text-3xl font-medium text-foreground tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};

export default PageTitle;
