
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

export interface DbCredentials {
  server: string;
  port?: string;
  user: string;
  password: string;
  database?: string;
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
      
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Tentar obter o texto da resposta se não conseguir analisar o JSON
        const errorText = await response.text();
        console.error('Resposta de erro não é JSON válido:', errorText);
        throw new Error(`Erro ao buscar veículo. Status: ${response.status}. Resposta: ${errorText}`);
      }
      
      console.error('Erro ao buscar veículo:', errorData);
      throw new Error(errorData.message || `Erro ao buscar veículo. Status: ${response.status}`);
    }
    
    // Retorna os dados do veículo
    try {
      const data = await response.json();
      console.log('Dados do veículo recebidos:', data);
      return data;
    } catch (e) {
      console.error('Erro ao analisar resposta JSON:', e);
      // Tentar obter o texto da resposta para diagnóstico
      const responseText = await response.text();
      console.error('Texto da resposta:', responseText);
      throw new Error(`Erro ao analisar resposta do servidor: ${responseText.substring(0, 200)}...`);
    }
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    throw error;
  }
}

// Adicionar uma função para testar a conexão com o servidor
export async function testApiConnection(): Promise<{ status: string; environment: any }> {
  try {
    console.log('Testando conexão com a API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    try {
      const response = await fetch('/api/status', { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      console.log(`Resposta do teste de API recebida. Status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Status da API retornou ${response.status}`);
        return { 
          status: 'offline', 
          environment: { 
            error: `Status da API retornou ${response.status}`,
            timestamp: new Date().toISOString()
          } 
        };
      }
      
      try {
        const data = await response.json();
        console.log('Dados de status da API:', data);
        return data;
      } catch (e) {
        console.error('Erro ao analisar resposta JSON do status:', e);
        // Tentar obter o texto da resposta para diagnóstico
        const responseText = await response.text();
        return { 
          status: 'error', 
          environment: { 
            error: 'Erro ao analisar resposta JSON',
            responseText: responseText.substring(0, 200),
            timestamp: new Date().toISOString()
          } 
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Timeout ao conectar com a API');
        return { 
          status: 'timeout', 
          environment: { 
            error: 'Timeout ao conectar com a API',
            timestamp: new Date().toISOString()
          } 
        };
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao testar conexão com a API:', error);
    return { 
      status: 'error', 
      environment: { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      } 
    };
  }
}

// Função para testar conexão com o banco de dados usando credenciais personalizadas
export async function testCustomDatabaseConnection(credentials: DbCredentials): Promise<any> {
  try {
    console.log('Testando conexão com credenciais personalizadas...');
    const response = await fetch('/api/test-connection-custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    console.log(`Resposta do teste de conexão recebida. Status: ${response.status}`);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      const textResponse = await response.text();
      throw new Error(`Erro ao analisar resposta JSON: ${textResponse.substring(0, 200)}...`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    throw error;
  }
}
