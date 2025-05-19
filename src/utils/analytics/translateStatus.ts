
/**
 * Traduz códigos de status para termos legíveis em português
 */
export function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ORCAMENTO': 'Orçamento',
    'PROPOSTA_GERADA': 'Proposta Gerada',
    'EM_VERIFICACAO': 'Em Verificação',
    'APROVADA': 'Aprovada',
    'REJEITADA': 'Rejeitada',
    'CANCELADA': 'Cancelada'
  };
  
  return statusMap[status] || status;
}
