
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
    
    // Faz a requisição para a API proxy local com timeout
    console.log(`Enviando requisição para: /api/vehicles/${cleanPlate}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
    
    try {
      const response = await fetch(`/api/vehicles/${cleanPlate}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      console.log(`Resposta recebida. Status: ${response.status}`);
      
      // Se a resposta não for ok (status 200-299), retorne null
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Veículo com placa ${cleanPlate} não encontrado`);
          return null;
        }
        
        // Tentar obter o texto da resposta para diagnóstico
        let errorText;
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = 'Não foi possível ler o texto da resposta';
        }
        
        console.error('Resposta de erro:', errorText);
        
        try {
          // Tenta analisar como JSON
          const errorData = JSON.parse(errorText);
          console.error('Dados de erro:', errorData);
          throw new Error(errorData.message || `Erro ao buscar veículo. Status: ${response.status}`);
        } catch (jsonError) {
          // Se não conseguir analisar como JSON, use o texto bruto
          console.error('Não foi possível analisar resposta como JSON:', jsonError);
          throw new Error(`Erro ao buscar veículo. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}`);
        }
      }
      
      // Tentar obter o texto da resposta
      const responseText = await response.text();
      console.log('Resposta texto recebida:', responseText.substring(0, 200));
      
      if (!responseText.trim()) {
        console.error('Resposta vazia recebida do servidor');
        throw new Error('Resposta vazia recebida do servidor');
      }
      
      try {
        // Tenta analisar como JSON
        const data = JSON.parse(responseText);
        console.log('Dados do veículo analisados:', data);
        return data;
      } catch (jsonError) {
        console.error('Erro ao analisar resposta JSON:', jsonError);
        throw new Error(`Erro ao analisar resposta do servidor: ${responseText.substring(0, 200)}...`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout ao conectar com o servidor. A operação demorou muito para responder.');
      }
      throw fetchError;
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
    
    // Primeiro, teste com o endpoint ping simples
    try {
      console.log('Tentando o endpoint /api/ping básico...');
      const pingResponse = await fetch('/api/ping', { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (pingResponse.ok) {
        let pingText = await pingResponse.text();
        console.log('Texto da resposta ping:', pingText);
        
        try {
          const pingData = JSON.parse(pingText);
          console.log('Ping da API bem-sucedido:', pingData);
        } catch (e) {
          console.warn('Ping retornou texto não-JSON:', pingText);
        }
      } else {
        console.warn('Ping da API falhou com status:', pingResponse.status);
      }
    } catch (pingError) {
      console.warn('Erro ao pingar a API:', pingError);
    }
    
    // Agora tente o endpoint de status principal
    console.log('Tentando o endpoint /api/status principal...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    try {
      const response = await fetch('/api/status', { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      console.log(`Resposta do teste de API recebida. Status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Status da API retornou ${response.status}`);
        // Tentar obter o texto da resposta para diagnóstico
        let errorText;
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = 'Não foi possível ler o texto da resposta';
        }
        
        console.error('Texto da resposta de erro:', errorText.substring(0, 200));
        
        return { 
          status: 'offline', 
          environment: { 
            error: `Status da API retornou ${response.status}`,
            responseText: errorText.substring(0, 200),
            timestamp: new Date().toISOString()
          } 
        };
      }
      
      // Tentar obter o texto da resposta para diagnóstico
      let responseText;
      try {
        responseText = await response.text();
      } catch (textError) {
        return { 
          status: 'error', 
          environment: { 
            error: `Erro ao ler resposta: ${textError.message}`,
            timestamp: new Date().toISOString()
          } 
        };
      }
      
      console.log('Resposta texto do status:', responseText.substring(0, 200));
      
      if (!responseText.trim()) {
        console.error('Resposta vazia recebida do servidor');
        return { 
          status: 'error', 
          environment: { 
            error: 'Resposta vazia recebida do servidor',
            timestamp: new Date().toISOString()
          } 
        };
      }
      
      try {
        // Tenta analisar como JSON
        const data = JSON.parse(responseText);
        console.log('Dados de status da API:', data);
        return data;
      } catch (jsonError) {
        console.error('Erro ao analisar resposta JSON do status:', jsonError);
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
    
    try {
      const response = await fetch('/api/test-connection-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(credentials),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log(`Resposta do teste de conexão recebida. Status: ${response.status}`);
      
      // Tentar obter o texto da resposta para diagnóstico
      const responseText = await response.text();
      console.log('Resposta texto do teste de conexão:', responseText.substring(0, 200));
      
      if (!responseText.trim()) {
        console.error('Resposta vazia recebida do servidor');
        throw new Error('Resposta vazia recebida do servidor');
      }
      
      try {
        // Tenta analisar como JSON
        const data = JSON.parse(responseText);
        console.log('Dados do teste de conexão:', data);
        return data;
      } catch (jsonError) {
        console.error('Erro ao analisar resposta JSON do teste de conexão:', jsonError);
        throw new Error(`Erro ao analisar resposta JSON: ${responseText.substring(0, 200)}...`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout ao conectar com o servidor. A operação demorou muito para responder.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    throw error;
  }
}
