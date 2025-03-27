
// Este arquivo é usado para fazer requisições à API que interage com o SQL Server

interface VehicleData {
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
export async function getVehicleByPlate(plate: string): Promise<VehicleData | null> {
  try {
    // Limpar a placa antes de enviar (remover espaços, hífens, etc.)
    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Faz a requisição para a API proxy local
    const response = await fetch(`/api/vehicles/${cleanPlate}`);
    
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
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    throw error;
  }
}
