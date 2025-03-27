
// Serviço para consulta de dados de CNPJ via API
interface CNPJResponse {
  status: string;
  nome?: string;
  fantasia?: string;
  email?: string;
  telefone?: string;
  situacao?: string;
  error?: string;
}

export async function consultarCNPJ(cnpj: string): Promise<CNPJResponse> {
  try {
    // Remover caracteres não numéricos
    const cnpjClean = cnpj.replace(/[^\d]/g, '');
    
    if (cnpjClean.length !== 14) {
      return { status: 'error', error: 'CNPJ deve conter 14 dígitos' };
    }

    // Usando a API pública da ReceitaWS
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjClean}`);
    
    if (!response.ok) {
      return { 
        status: 'error', 
        error: `Erro ao consultar CNPJ: ${response.statusText}` 
      };
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      return { 
        status: 'error', 
        error: data.message || 'Erro na consulta do CNPJ' 
      };
    }

    return {
      status: 'success',
      nome: data.nome,
      fantasia: data.fantasia,
      email: data.email,
      telefone: data.telefone,
      situacao: data.situacao
    };
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    return { 
      status: 'error', 
      error: 'Erro na comunicação com a API de CNPJ' 
    };
  }
}
