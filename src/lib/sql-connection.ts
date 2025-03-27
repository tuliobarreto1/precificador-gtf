
// Este arquivo é usado para fazer requisições à API que interage com o SQL Server

export interface SqlVehicle {
  Placa: string;
  DescricaoModelo: string;
  AnoFabricacaoModelo: string;
  Cor: string;
  TipoCombustivel: string;
  OdometroAtual: number;
  ValorCompra: number;
  LetraGrupo: string;
}

/**
 * Busca um veículo pelo número da placa
 * @param plate Número da placa do veículo
 * @returns Dados do veículo ou null se não encontrado
 */
export async function getVehicleByPlate(plate: string): Promise<SqlVehicle | null> {
  try {
    console.log(`Iniciando busca de veículo com placa: ${plate}`);
    
    // Limpar a placa antes de enviar (remover espaços, hífens, etc.)
    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    console.log(`Placa formatada: ${cleanPlate}`);
    
    // Faz a requisição para a API proxy local
    console.log(`Enviando requisição para: /api/vehicles/${cleanPlate}`);
    const response = await fetch(`/api/vehicles/${cleanPlate}`);
    console.log(`Resposta recebida. Status: ${response.status}`);
    
    // Se a resposta não for ok (status 200-299), retorne null
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Veículo com placa ${cleanPlate} não encontrado`);
        return null;
      }
      
      const errorData = await response.json();
      console.error('Erro ao buscar veículo:', errorData);
      throw new Error(errorData.message || 'Erro ao buscar veículo');
    }
    
    // Retorna os dados do veículo
    const data = await response.json();
    console.log('Dados do veículo recebidos:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    throw error;
  }
}

// Adicionar uma função para testar a conexão com o servidor
export async function testApiConnection(): Promise<{ status: string; environment: any }> {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) {
      throw new Error(`Status da API retornou ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao testar conexão com a API:', error);
    throw error;
  }
}
