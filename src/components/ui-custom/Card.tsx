
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
};

const Card = ({ children, className, onClick, hoverable = false }: CardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl border border-border p-6 animate-fadeIn shadow-sm",
        hoverable && "transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export type CardHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export const CardHeader = ({ title, subtitle, action, className }: CardHeaderProps) => {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default Card;
