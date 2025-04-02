
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
  AlertCircle,
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
  CheckCircle,
  AlertCircle
};

// Configuração padrão para status inválidos/não encontrados
const defaultStatusConfig = {
  label: "Status Desconhecido",
  shortLabel: "Desconhecido",
  description: "Status não reconhecido pelo sistema",
  color: "bg-gray-100 text-gray-800",
  icon: "AlertCircle",
  step: 0,
  progressColor: "bg-gray-500"
};

interface StatusBadgeProps {
  status: QuoteStatusFlow | string;
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
  // Verificar se o status é válido e obter os dados correspondentes
  // ou usar configuração padrão para status não reconhecidos
  const statusData = statusInfo[status as QuoteStatusFlow] || defaultStatusConfig;
  
  // Garantir que temos um ícone válido ou usar AlertCircle como fallback
  const iconName = statusData.icon || "AlertCircle";
  const Icon = statusIcons[iconName] || AlertCircle;
  
  const sizes = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };
  
  return (
    <div className={cn(
      'flex items-center rounded border',
      statusData.color || defaultStatusConfig.color,
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
