
// Definição dos possíveis status de fluxo de um orçamento
export type QuoteStatusFlow = 
  | 'ORCAMENTO' 
  | 'PROPOSTA_GERADA' 
  | 'EM_VERIFICACAO' 
  | 'APROVADA' 
  | 'CONTRATO_GERADO' 
  | 'ASSINATURA_CLIENTE' 
  | 'ASSINATURA_DIRETORIA' 
  | 'AGENDAMENTO_ENTREGA' 
  | 'ENTREGA' 
  | 'CONCLUIDO'
  | 'draft'; // Adicionando 'draft' como possível status para compatibilidade

// Definição de tipo para status válidos no banco de dados (sem o 'draft')
export type DbQuoteStatus =
  | 'ORCAMENTO' 
  | 'PROPOSTA_GERADA' 
  | 'EM_VERIFICACAO' 
  | 'APROVADA' 
  | 'CONTRATO_GERADO' 
  | 'ASSINATURA_CLIENTE' 
  | 'ASSINATURA_DIRETORIA' 
  | 'AGENDAMENTO_ENTREGA' 
  | 'ENTREGA' 
  | 'CONCLUIDO';

// Definição do item de histórico de status
export interface StatusHistoryItem {
  id: string;
  quote_id: string;
  previous_status?: QuoteStatusFlow;
  new_status: QuoteStatusFlow;
  changed_by: string;
  changed_at: string;
  observation?: string;
  user_name?: string;
}

// Array com todos os status em ordem de fluxo
export const allStatus: QuoteStatusFlow[] = [
  'ORCAMENTO',
  'PROPOSTA_GERADA',
  'EM_VERIFICACAO',
  'APROVADA',
  'CONTRATO_GERADO',
  'ASSINATURA_CLIENTE',
  'ASSINATURA_DIRETORIA',
  'AGENDAMENTO_ENTREGA',
  'ENTREGA',
  'CONCLUIDO',
  'draft'
];

// Função para calcular o progresso baseado no status atual
export const calculateProgress = (currentStatus: QuoteStatusFlow): number => {
  const index = allStatus.indexOf(currentStatus);
  if (index === -1) return 0;
  
  return Math.round((index / (allStatus.length - 1)) * 100);
};

// Função para verificar se a transição de status é válida
export const isValidTransition = (
  fromStatus: QuoteStatusFlow, 
  toStatus: QuoteStatusFlow
): boolean => {
  const fromIndex = allStatus.indexOf(fromStatus);
  const toIndex = allStatus.indexOf(toStatus);
  
  // Permitir voltar para qualquer status anterior
  if (toIndex < fromIndex) return true;
  
  // Permitir avançar apenas para o próximo status
  return toIndex === fromIndex + 1;
};

// Função para converter entre o status interno da aplicação e o status do banco de dados
export const toDbStatus = (status: QuoteStatusFlow): DbQuoteStatus => {
  return status === 'draft' ? 'ORCAMENTO' : status as DbQuoteStatus;
};

// Informações detalhadas sobre cada status
export const statusInfo: Record<QuoteStatusFlow, {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: string;
  step: number;
  progressColor: string;
}> = {
  'ORCAMENTO': {
    label: 'Orçamento',
    shortLabel: 'Orçamento',
    description: 'Orçamento inicial criado',
    color: 'bg-blue-100 text-blue-800',
    icon: 'FileEdit',
    step: 1,
    progressColor: 'bg-blue-500'
  },
  'PROPOSTA_GERADA': {
    label: 'Proposta Gerada',
    shortLabel: 'Proposta',
    description: 'Proposta formal gerada e pronta para envio',
    color: 'bg-indigo-100 text-indigo-800',
    icon: 'FileText',
    step: 2,
    progressColor: 'bg-indigo-500'
  },
  'EM_VERIFICACAO': {
    label: 'Em Verificação',
    shortLabel: 'Verificação',
    description: 'Proposta em análise pelo cliente',
    color: 'bg-purple-100 text-purple-800',
    icon: 'ClipboardCheck',
    step: 3,
    progressColor: 'bg-purple-500'
  },
  'APROVADA': {
    label: 'Aprovada',
    shortLabel: 'Aprovada',
    description: 'Proposta aprovada pelo cliente',
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle',
    step: 4,
    progressColor: 'bg-green-500'
  },
  'CONTRATO_GERADO': {
    label: 'Contrato Gerado',
    shortLabel: 'Contrato',
    description: 'Contrato formal gerado e pronto para assinatura',
    color: 'bg-teal-100 text-teal-800',
    icon: 'FileCheck',
    step: 5,
    progressColor: 'bg-teal-500'
  },
  'ASSINATURA_CLIENTE': {
    label: 'Assinatura do Cliente',
    shortLabel: 'Ass. Cliente',
    description: 'Aguardando assinatura do cliente',
    color: 'bg-amber-100 text-amber-800',
    icon: 'FileSignature',
    step: 6,
    progressColor: 'bg-amber-500'
  },
  'ASSINATURA_DIRETORIA': {
    label: 'Assinatura da Diretoria',
    shortLabel: 'Ass. Diretoria',
    description: 'Aguardando assinatura da diretoria',
    color: 'bg-orange-100 text-orange-800',
    icon: 'FileSignature',
    step: 7,
    progressColor: 'bg-orange-500'
  },
  'AGENDAMENTO_ENTREGA': {
    label: 'Agendamento de Entrega',
    shortLabel: 'Agendamento',
    description: 'Entrega sendo agendada com o cliente',
    color: 'bg-rose-100 text-rose-800',
    icon: 'CalendarRange',
    step: 8,
    progressColor: 'bg-rose-500'
  },
  'ENTREGA': {
    label: 'Entrega',
    shortLabel: 'Entrega',
    description: 'Veículos em processo de entrega',
    color: 'bg-pink-100 text-pink-800',
    icon: 'Car',
    step: 9,
    progressColor: 'bg-pink-500'
  },
  'CONCLUIDO': {
    label: 'Concluído',
    shortLabel: 'Concluído',
    description: 'Processo concluído com sucesso',
    color: 'bg-emerald-100 text-emerald-800',
    icon: 'CheckCircle',
    step: 10,
    progressColor: 'bg-emerald-500'
  },
  // Adicionando status 'draft' para compatibilidade com orçamentos salvos localmente
  'draft': {
    label: 'Rascunho',
    shortLabel: 'Rascunho',
    description: 'Orçamento em estado de rascunho',
    color: 'bg-gray-100 text-gray-800',
    icon: 'FileEdit',
    step: 0,
    progressColor: 'bg-gray-500'
  }
};
