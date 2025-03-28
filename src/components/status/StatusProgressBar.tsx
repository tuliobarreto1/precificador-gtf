
import React from 'react';
import { QuoteStatusFlow, statusInfo, allStatus, calculateProgress } from '@/lib/status-flow';
import { cn } from '@/lib/utils';

interface StatusProgressBarProps {
  currentStatus: QuoteStatusFlow;
  className?: string;
}

const StatusProgressBar: React.FC<StatusProgressBarProps> = ({ currentStatus, className }) => {
  const progress = calculateProgress(currentStatus);
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", 
            statusInfo[currentStatus].progressColor
          )} 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Orçamento</span>
        <span>Em andamento</span>
        <span>Concluído</span>
      </div>
    </div>
  );
};

export default StatusProgressBar;
