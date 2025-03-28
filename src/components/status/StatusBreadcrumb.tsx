
import React from 'react';
import { QuoteStatusFlow, statusInfo, allStatus } from '@/lib/status-flow';
import { cn } from '@/lib/utils';
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

interface StatusBreadcrumbProps {
  currentStatus: QuoteStatusFlow;
  className?: string;
  maxVisible?: number;
  onClickStatus?: (status: QuoteStatusFlow) => void;
}

const StatusBreadcrumb: React.FC<StatusBreadcrumbProps> = ({ 
  currentStatus, 
  className,
  maxVisible = 5,
  onClickStatus
}) => {
  const currentIndex = allStatus.indexOf(currentStatus);
  
  // Determinar quais status exibir no breadcrumb
  let displayStatuses: QuoteStatusFlow[] = [];
  
  if (allStatus.length <= maxVisible) {
    displayStatuses = [...allStatus];
  } else {
    // Estratégia para mostrar status relevantes quando há muitos
    // Sempre mostrar o primeiro e o último
    // Mostrar o atual e alguns antes e depois
    
    const startIndex = Math.max(0, Math.min(currentIndex - Math.floor((maxVisible - 2) / 2), allStatus.length - maxVisible + 1));
    displayStatuses = allStatus.slice(startIndex, startIndex + maxVisible - 2);
    
    // Adicionar primeiro e último
    if (!displayStatuses.includes(allStatus[0])) {
      displayStatuses = [allStatus[0], ...displayStatuses];
    }
    
    if (!displayStatuses.includes(allStatus[allStatus.length - 1])) {
      displayStatuses = [...displayStatuses, allStatus[allStatus.length - 1]];
    }
  }

  return (
    <div className={cn('flex items-center overflow-x-auto pb-2', className)}>
      {displayStatuses.map((status, index) => {
        const isActive = status === currentStatus;
        const isPast = allStatus.indexOf(status) < allStatus.indexOf(currentStatus);
        const statusData = statusInfo[status];
        const Icon = statusIcons[statusData.icon];
        
        return (
          <React.Fragment key={status}>
            {index > 0 && (
              <div 
                className={cn(
                  'h-px w-6 mx-1',
                  isPast ? statusData.progressColor : 'bg-gray-200'
                )}
              />
            )}
            <div 
              className={cn(
                'flex items-center rounded px-2 py-1 text-xs font-medium',
                isActive && statusData.color,
                isPast && 'bg-gray-100 text-gray-600',
                !isPast && !isActive && 'bg-gray-50 text-gray-400',
                onClickStatus && 'cursor-pointer hover:ring-1 hover:ring-primary/20'
              )}
              onClick={() => onClickStatus && onClickStatus(status)}
            >
              {Icon && (
                <Icon className="mr-1 h-3 w-3" />
              )}
              <span className="whitespace-nowrap">{statusData.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StatusBreadcrumb;
