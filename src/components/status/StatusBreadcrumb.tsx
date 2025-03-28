
import React from 'react';
import { cn } from '@/lib/utils';
import { Check, CircleDot } from 'lucide-react';
import { QuoteStatusFlow, statusInfo } from '@/lib/status-flow';

interface StatusBreadcrumbProps {
  currentStatus: QuoteStatusFlow;
  className?: string;
}

const StatusBreadcrumb: React.FC<StatusBreadcrumbProps> = ({ 
  currentStatus, 
  className 
}) => {
  // Array de todos os status possíveis em ordem
  const allStatuses: QuoteStatusFlow[] = [
    'ORCAMENTO',
    'PROPOSTA_GERADA',
    'EM_VERIFICACAO',
    'APROVADA',
    'CONTRATO_GERADO',
    'ASSINATURA_CLIENTE',
    'ASSINATURA_DIRETORIA',
    'AGENDAMENTO_ENTREGA',
    'ENTREGA',
    'CONCLUIDO'
  ];

  // Índice do status atual
  const currentIndex = allStatuses.findIndex(status => status === currentStatus);
  
  // Se o status atual não for encontrado, usar o primeiro
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  // Definir quantos passos mostrar antes e depois do atual (para telas menores)
  const visibleStatuses = allStatuses.slice(
    Math.max(0, activeIndex - 1),
    Math.min(allStatuses.length, activeIndex + 3)
  );
  
  // Verificar se precisamos mostrar indicadores de "mais etapas"
  const showStartEllipsis = activeIndex > 1;
  const showEndEllipsis = activeIndex + 3 < allStatuses.length;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Status atual */}
      <div className="mb-2 text-sm font-medium">
        Status atual: <span className="text-primary">{statusInfo[currentStatus]?.label || currentStatus}</span>
      </div>
      
      {/* Breadcrumb de status */}
      <div className="hidden md:flex items-center space-x-2">
        {showStartEllipsis && (
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">...</div>
            <div className="h-0.5 w-4 bg-muted"></div>
          </div>
        )}
        
        {visibleStatuses.map((status, index) => {
          const isActive = status === currentStatus;
          const isPassed = allStatuses.indexOf(status) < activeIndex;
          
          return (
            <React.Fragment key={status}>
              {index > 0 && (
                <div 
                  className={cn(
                    "h-0.5 w-4 md:w-6 lg:w-10", 
                    isPassed ? "bg-primary" : "bg-muted"
                  )}
                ></div>
              )}
              
              <div 
                className={cn(
                  "flex flex-col items-center",
                  isActive && "text-primary"
                )}
              >
                <div 
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                    isActive ? "bg-primary text-primary-foreground" : 
                    isPassed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isPassed ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    isActive ? (
                      <CircleDot className="h-3 w-3" />
                    ) : (
                      allStatuses.indexOf(status) + 1
                    )
                  )}
                </div>
                
                <span className="text-[10px] mt-1 hidden lg:block">
                  {statusInfo[status]?.shortLabel || status}
                </span>
              </div>
            </React.Fragment>
          );
        })}
        
        {showEndEllipsis && (
          <div className="flex items-center">
            <div className="h-0.5 w-4 bg-muted"></div>
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">...</div>
          </div>
        )}
      </div>
      
      {/* Versão móvel - apenas status atual */}
      <div className="flex md:hidden items-center space-x-2">
        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
          <CircleDot className="h-3 w-3" />
        </div>
        <span className="text-xs">
          {statusInfo[currentStatus]?.label || currentStatus}
        </span>
      </div>
    </div>
  );
};

export default StatusBreadcrumb;
