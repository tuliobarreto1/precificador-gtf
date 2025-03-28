
import React from 'react';
import { QuoteStatusFlow, statusInfo } from '@/lib/status-flow';
import { 
  FileEdit, 
  FileCheck, 
  ClipboardCheck, 
  ThumbsUp, 
  FileText, 
  FileSignature, 
  Briefcase, 
  CalendarRange, 
  Car, 
  CheckCircle,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento de ícones
const statusIcons: Record<string, LucideIcon> = {
  FileEdit,
  FileCheck,
  ClipboardCheck,
  ThumbsUp,
  FileText,
  FileSignature,
  Briefcase,
  CalendarRange,
  Car,
  CheckCircle
};

interface StatusBadgeProps {
  status: QuoteStatusFlow;
  className?: string;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className, 
  showDescription = false, 
  size = 'md'
}) => {
  const statusData = statusInfo[status];
  const Icon = statusIcons[statusData.icon];
  
  const sizes = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };
  
  return (
    <div className={cn(
      'flex items-center rounded border',
      statusData.color,
      sizes[size],
      className
    )}>
      {Icon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5')} />}
      <span>{statusData.label}</span>
      {showDescription && (
        <span className="ml-1 opacity-75 text-xs">{statusData.description}</span>
      )}
    </div>
  );
};

export default StatusBadge;
