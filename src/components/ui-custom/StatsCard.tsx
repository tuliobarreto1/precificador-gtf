
import React from 'react';
import { cn } from '@/lib/utils';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

const StatsCard = ({ title, value, icon, trend, className }: StatsCardProps) => {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-border p-5 shadow-sm",
      "transition-all duration-300 hover:shadow-md",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          
          {trend && (
            <div className="mt-2 flex items-center">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-1 text-xs text-muted-foreground">vs. último mês</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
