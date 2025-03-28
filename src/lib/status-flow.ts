
// Enum para os status possíveis do processo
export enum QuoteStatusFlow {
  ORCAMENTO = 'ORCAMENTO',
  PROPOSTA_GERADA = 'PROPOSTA_GERADA',
  EM_VERIFICACAO = 'EM_VERIFICACAO',
  APROVADA = 'APROVADA',
  CONTRATO_GERADO = 'CONTRATO_GERADO',
  ASSINATURA_CLIENTE = 'ASSINATURA_CLIENTE',
  ASSINATURA_DIRETORIA = 'ASSINATURA_DIRETORIA',
  AGENDAMENTO_ENTREGA = 'AGENDAMENTO_ENTREGA',
  ENTREGA = 'ENTREGA',
  CONCLUIDO = 'CONCLUIDO'
}

// Interface para o histórico de mudança de status
export interface StatusHistoryItem {
  id: string;
  quote_id: string;
  previous_status: QuoteStatusFlow | null;
  new_status: QuoteStatusFlow;
  changed_by: string | null;
  changed_at: string;
  observation: string | null;
  user_name?: string; // Nome do usuário que fez a mudança
}

// Objeto que mapeia o status para suas informações de exibição
export const statusInfo = {
  [QuoteStatusFlow.ORCAMENTO]: {
    label: 'Orçamento',
    description: 'Orçamento em elaboração',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: 'FileEdit',
    step: 1,
    progressColor: 'bg-sky-500'
  },
  [QuoteStatusFlow.PROPOSTA_GERADA]: {
    label: 'Proposta Gerada',
    description: 'Proposta pronta para envio',
    color: 'bg-sky-200 text-sky-900 border-sky-300',
    icon: 'FileCheck',
    step: 2,
    progressColor: 'bg-sky-600'
  },
  [QuoteStatusFlow.EM_VERIFICACAO]: {
    label: 'Em Verificação',
    description: 'Enviada para verificação do cliente',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'ClipboardCheck',
    step: 3,
    progressColor: 'bg-amber-500'
  },
  [QuoteStatusFlow.APROVADA]: {
    label: 'Aprovada',
    description: 'Cliente aprovou a proposta',
    color: 'bg-amber-200 text-amber-900 border-amber-300',
    icon: 'ThumbsUp',
    step: 4,
    progressColor: 'bg-amber-600'
  },
  [QuoteStatusFlow.CONTRATO_GERADO]: {
    label: 'Contrato Gerado',
    description: 'Contrato pronto para assinatura',
    color: 'bg-amber-300 text-amber-950 border-amber-400',
    icon: 'FileText',
    step: 5,
    progressColor: 'bg-amber-700'
  },
  [QuoteStatusFlow.ASSINATURA_CLIENTE]: {
    label: 'Aguardando Assinatura do Cliente',
    description: 'Contrato enviado para o cliente assinar',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'FileSignature',
    step: 6,
    progressColor: 'bg-gray-500'
  },
  [QuoteStatusFlow.ASSINATURA_DIRETORIA]: {
    label: 'Aguardando Assinatura da Diretoria',
    description: 'Contrato aguardando assinatura interna',
    color: 'bg-gray-200 text-gray-900 border-gray-300',
    icon: 'Briefcase',
    step: 7,
    progressColor: 'bg-gray-600'
  },
  [QuoteStatusFlow.AGENDAMENTO_ENTREGA]: {
    label: 'Agendamento de Entrega',
    description: 'Definindo data de entrega',
    color: 'bg-lime-100 text-lime-800 border-lime-200',
    icon: 'CalendarRange',
    step: 8,
    progressColor: 'bg-lime-500'
  },
  [QuoteStatusFlow.ENTREGA]: {
    label: 'Entrega',
    description: 'Entrega do veículo programada',
    color: 'bg-lime-200 text-lime-900 border-lime-300',
    icon: 'Car',
    step: 9,
    progressColor: 'bg-lime-600'
  },
  [QuoteStatusFlow.CONCLUIDO]: {
    label: 'Concluído',
    description: 'Processo finalizado',
    color: 'bg-green-200 text-green-900 border-green-300',
    icon: 'CheckCircle',
    step: 10,
    progressColor: 'bg-green-600'
  }
};

// Array de todos os status em ordem
export const allStatus = [
  QuoteStatusFlow.ORCAMENTO,
  QuoteStatusFlow.PROPOSTA_GERADA,
  QuoteStatusFlow.EM_VERIFICACAO,
  QuoteStatusFlow.APROVADA,
  QuoteStatusFlow.CONTRATO_GERADO,
  QuoteStatusFlow.ASSINATURA_CLIENTE,
  QuoteStatusFlow.ASSINATURA_DIRETORIA,
  QuoteStatusFlow.AGENDAMENTO_ENTREGA,
  QuoteStatusFlow.ENTREGA,
  QuoteStatusFlow.CONCLUIDO
];

// Função para calcular o progresso
export function calculateProgress(status: QuoteStatusFlow): number {
  const currentStep = statusInfo[status].step;
  return (currentStep / allStatus.length) * 100;
}

// Função para verificar se uma transição de status é válida
export function isValidTransition(currentStatus: QuoteStatusFlow, newStatus: QuoteStatusFlow): boolean {
  // Permitir voltar para qualquer status anterior
  const currentIndex = allStatus.indexOf(currentStatus);
  const newIndex = allStatus.indexOf(newStatus);
  
  if (newIndex < currentIndex) {
    return true; // Permite retroceder
  }
  
  // Apenas permite avançar para o próximo status na sequência
  return newIndex === currentIndex + 1;
}
