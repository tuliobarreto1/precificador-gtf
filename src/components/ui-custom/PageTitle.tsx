
import React from 'react';
import { cn } from '@/lib/utils';

type PageTitleProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

const PageTitle = ({ title, subtitle, className }: PageTitleProps) => {
  return (
    <div className={cn("mb-8 animate-slideInFromBottom", className)}>
      <h1 className="text-3xl font-medium text-foreground tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};

export default PageTitle;
