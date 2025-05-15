// Tipos para o fluxo de status
export type QuoteStatusFlow = 
  'draft' | 
  'ORCAMENTO' | 
  'PROPOSTA_GERADA' | 
  'EM_VERIFICACAO' | 
  'APROVADA' | 
  'CONTRATO_GERADO' | 
  'ASSINATURA_CLIENTE' | 
  'ASSINATURA_DIRETORIA' |
  'AGENDAMENTO_ENTREGA' | 
  'ENTREGA' | 
  'CONCLUIDO' |
  'CANCELADO';

export interface StatusHistoryItem {
  id: string;
  quote_id: string;
  previous_status: QuoteStatusFlow | null;
  new_status: QuoteStatusFlow;
  changed_by: string | null;
  changed_at: string | Date;
  user_name?: string;
  observation?: string;
}

// Informações de cada status para exibição na interface
export const statusInfo: Record<QuoteStatusFlow, {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: string;
  step: number;
  progressColor: string;
}> = {
  draft: {
    label: "Rascunho",
    shortLabel: "Rascunho",
    description: "Orçamento em elaboração",
    color: "bg-slate-100 text-slate-800",
    icon: "FileEdit",
    step: 0,
    progressColor: "bg-slate-400"
  },
  ORCAMENTO: {
    label: "Orçamento",
    shortLabel: "Orçamento",
    description: "Orçamento inicial criado",
    color: "bg-blue-100 text-blue-800",
    icon: "FileText",
    step: 1,
    progressColor: "bg-blue-500"
  },
  PROPOSTA_GERADA: {
    label: "Proposta Gerada",
    shortLabel: "Proposta",
    description: "Proposta comercial gerada",
    color: "bg-indigo-100 text-indigo-800",
    icon: "FileCheck",
    step: 2,
    progressColor: "bg-indigo-500"
  },
  EM_VERIFICACAO: {
    label: "Em Verificação",
    shortLabel: "Verificação",
    description: "Proposta em análise pelo cliente",
    color: "bg-orange-100 text-orange-800",
    icon: "ClipboardCheck",
    step: 3,
    progressColor: "bg-orange-500"
  },
  APROVADA: {
    label: "Aprovada",
    shortLabel: "Aprovada",
    description: "Proposta aprovada pelo cliente",
    color: "bg-emerald-100 text-emerald-800",
    icon: "ThumbsUp",
    step: 4,
    progressColor: "bg-emerald-500"
  },
  CONTRATO_GERADO: {
    label: "Contrato Gerado",
    shortLabel: "Contrato",
    description: "Contrato de locação gerado",
    color: "bg-purple-100 text-purple-800",
    icon: "FileSignature",
    step: 5,
    progressColor: "bg-purple-500"
  },
  ASSINATURA_CLIENTE: {
    label: "Aguard. Assinatura Cliente",
    shortLabel: "Ass. Cliente",
    description: "Aguardando assinatura do cliente",
    color: "bg-amber-100 text-amber-800",
    icon: "Briefcase",
    step: 6,
    progressColor: "bg-amber-500"
  },
  ASSINATURA_DIRETORIA: {
    label: "Aguard. Assinatura Diretoria",
    shortLabel: "Ass. Diretoria",
    description: "Aguardando assinatura da diretoria",
    color: "bg-cyan-100 text-cyan-800",
    icon: "FileSignature",
    step: 7,
    progressColor: "bg-cyan-500"
  },
  AGENDAMENTO_ENTREGA: {
    label: "Agendamento de Entrega",
    shortLabel: "Agendamento",
    description: "Agendando entrega dos veículos",
    color: "bg-teal-100 text-teal-800",
    icon: "CalendarRange",
    step: 8,
    progressColor: "bg-teal-500"
  },
  ENTREGA: {
    label: "Em Entrega",
    shortLabel: "Entrega",
    description: "Veículos em processo de entrega",
    color: "bg-lime-100 text-lime-800",
    icon: "Car",
    step: 9,
    progressColor: "bg-lime-500"
  },
  CONCLUIDO: {
    label: "Concluído",
    shortLabel: "Concluído",
    description: "Processo finalizado com sucesso",
    color: "bg-green-100 text-green-800",
    icon: "CheckCircle",
    step: 10,
    progressColor: "bg-green-500"
  },
  CANCELADO: {
    label: "Cancelado",
    shortLabel: "Cancelado",
    description: "Orçamento/Proposta cancelado",
    color: "bg-red-100 text-red-800",
    icon: "AlertCircle",
    step: -1,
    progressColor: "bg-red-500"
  }
};

// Lista de todos os status na ordem do fluxo
export const allStatus: QuoteStatusFlow[] = [
  'draft',
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

// Verifica se a transição de status é válida
export const isValidTransition = (currentStatus: QuoteStatusFlow, newStatus: QuoteStatusFlow): boolean => {
  // Permitir voltar para qualquer status anterior (para retrabalho)
  const currentIndex = allStatus.indexOf(currentStatus);
  const newIndex = allStatus.indexOf(newStatus);
  
  // Se o novo status vem antes do atual no fluxo, permitimos
  if (newIndex < currentIndex) return true;
  
  // Se for o próximo status na sequência, também permitimos
  if (newIndex === currentIndex + 1) return true;
  
  // Para cancelamento, sempre permitimos
  if (newStatus === 'CANCELADO') return true;
  
  // Qualquer outra transição não é permitida
  return false;
};

// Adicionar função calculateProgress
export const calculateProgress = (currentStatus: QuoteStatusFlow): number => {
  // Status especiais
  if (currentStatus === 'CANCELADO') return 0;
  if (currentStatus === 'CONCLUIDO') return 100;
  
  // Calcular progresso com base no índice do status no fluxo
  const currentIndex = allStatus.indexOf(currentStatus);
  if (currentIndex === -1) return 0;
  
  // Ajustar para rascunho que é um status especial
  const maxSteps = allStatus.length - 1; // -1 pois não consideramos 'draft' como etapa final
  return Math.round((currentIndex / maxSteps) * 100);
};
