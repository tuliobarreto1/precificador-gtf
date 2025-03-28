
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
  | 'CONCLUIDO';

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
    icon: 'Search',
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
    icon: 'PenTool',
    step: 6,
    progressColor: 'bg-amber-500'
  },
  'ASSINATURA_DIRETORIA': {
    label: 'Assinatura da Diretoria',
    shortLabel: 'Ass. Diretoria',
    description: 'Aguardando assinatura da diretoria',
    color: 'bg-orange-100 text-orange-800',
    icon: 'Stamp',
    step: 7,
    progressColor: 'bg-orange-500'
  },
  'AGENDAMENTO_ENTREGA': {
    label: 'Agendamento de Entrega',
    shortLabel: 'Agendamento',
    description: 'Entrega sendo agendada com o cliente',
    color: 'bg-rose-100 text-rose-800',
    icon: 'Calendar',
    step: 8,
    progressColor: 'bg-rose-500'
  },
  'ENTREGA': {
    label: 'Entrega',
    shortLabel: 'Entrega',
    description: 'Veículos em processo de entrega',
    color: 'bg-pink-100 text-pink-800',
    icon: 'Truck',
    step: 9,
    progressColor: 'bg-pink-500'
  },
  'CONCLUIDO': {
    label: 'Concluído',
    shortLabel: 'Concluído',
    description: 'Processo concluído com sucesso',
    color: 'bg-emerald-100 text-emerald-800',
    icon: 'CheckSquare',
    step: 10,
    progressColor: 'bg-emerald-500'
  }
};
