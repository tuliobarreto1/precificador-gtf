
// Configurações e funções para conexão com SQL Server
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://precificador-gtf.vercel.app/api'
  : 'http://localhost:3005/api';

// Interface para respostas da API
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: string;
}

// Interface para veículo SQL
export interface SqlVehicle {
  CodigoMVA: string;
  Placa: string;
  CodigoModelo: string;
  DescricaoModelo: string;
  CodigoGrupoVeiculo: string;
  LetraGrupo: string;
  DescricaoGrupo: string;
  AnoFabricacaoModelo: number;
  Cor: string;
  TipoCombustivel: string;
  NumeroPassageiros: number;
  OdometroAtual: number;
  Status: string;
  DescricaoStatus: string;
  ValorCompra: number;
  DataCompra: string;
}

// Interface para modelo de veículo
export interface SqlVehicleModel {
  CodigoModelo: string;
  Descricao: string;
  CodigoGrupoVeiculo: string;
  LetraGrupo: string;
  MaiorValorCompra: number;
}

// Interface para grupo de veículo
export interface SqlVehicleGroup {
  CodigoGrupo: string;
  Letra: string;
  Descricao: string;
}

// Função auxiliar para fazer requisições HTTP com melhor tratamento de erro
async function makeApiRequest(url: string, options: RequestInit = {}): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

  try {
    console.log(`Fazendo requisição para: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    console.log(`Resposta recebida - Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

    // Verificar se a resposta é realmente JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Resposta não é JSON:', textResponse.substring(0, 500));
      throw new Error(`Servidor retornou ${contentType || 'conteúdo desconhecido'} em vez de JSON. Possível erro no servidor.`);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`Erro HTTP ${response.status}:`, data);
      throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
    }

    return {
      success: true,
      data,
      status: 'success'
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('Requisição cancelada por timeout');
      throw new Error('Timeout: Servidor demorou muito para responder (>30s)');
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Erro de rede:', error);
      throw new Error('Erro de conexão: Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
    }

    console.error('Erro na requisição:', error);
    throw error;
  }
}

// Testar conexão com a API
export async function testApiConnection(): Promise<{ status: string; error?: string; details?: any }> {
  try {
    console.log('Testando conexão com a API...');
    console.log('URL base da API:', API_BASE_URL);
    
    // Primeiro, testar a rota de status
    const statusResponse = await makeApiRequest(`${API_BASE_URL}/status`);
    console.log('Resposta do status:', statusResponse);

    if (statusResponse.success) {
      // Agora testar a conexão com o banco de dados
      console.log('Testando conexão com o banco de dados...');
      const dbTestResponse = await makeApiRequest(`${API_BASE_URL}/test-connection`);
      
      if (dbTestResponse.success) {
        return {
          status: 'online',
          details: {
            api: statusResponse.data,
            database: dbTestResponse.data
          }
        };
      } else {
        return {
          status: 'offline',
          error: 'API online, mas banco de dados inacessível',
          details: dbTestResponse
        };
      }
    } else {
      return {
        status: 'offline',
        error: 'API não está respondendo corretamente',
        details: statusResponse
      };
    }

  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return {
      status: 'offline',
      error: error.message || 'Erro desconhecido ao conectar',
      details: {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      }
    };
  }
}

// Buscar veículo por placa
export async function getVehicleByPlate(plate: string): Promise<SqlVehicle | null> {
  try {
    console.log(`Buscando veículo com placa: ${plate}`);
    
    if (!plate || plate.trim() === '') {
      throw new Error('Placa não pode estar vazia');
    }

    const response = await makeApiRequest(`${API_BASE_URL}/vehicles/${encodeURIComponent(plate.trim())}`);
    
    if (response.success && response.data) {
      console.log('Veículo encontrado:', response.data);
      return response.data;
    } else {
      console.log('Veículo não encontrado');
      return null;
    }

  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    if (error.message.includes('404')) {
      return null; // Veículo não encontrado
    }
    throw error;
  }
}

// Buscar grupos de veículos
export async function getVehicleGroups(): Promise<SqlVehicleGroup[]> {
  try {
    console.log('Buscando grupos de veículos...');
    
    const response = await makeApiRequest(`${API_BASE_URL}/vehicle-groups`);
    
    if (response.success && response.data) {
      // Se retornou dados de fallback, avisar no console
      if (response.data.message && response.data.message.includes('fallback')) {
        console.warn('Usando dados de fallback para grupos de veículos:', response.data.message);
        return response.data.data || [];
      }
      
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } else {
      console.warn('Nenhum grupo de veículo encontrado, usando dados padrão');
      return [];
    }

  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
    throw error;
  }
}

// Buscar modelos de veículos por grupo
export async function getVehicleModelsByGroup(groupCode: string): Promise<SqlVehicleModel[]> {
  try {
    console.log(`Buscando modelos para o grupo: ${groupCode}`);
    
    if (!groupCode || groupCode.trim() === '') {
      throw new Error('Código do grupo não pode estar vazio');
    }

    const response = await makeApiRequest(`${API_BASE_URL}/vehicle-models/${encodeURIComponent(groupCode.trim())}`);
    
    if (response.success && response.data) {
      // Se retornou dados de fallback, avisar no console
      if (response.data.message && response.data.message.includes('fallback')) {
        console.warn('Usando dados de fallback para modelos de veículos:', response.data.message);
        return response.data.data || [];
      }
      
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } else {
      console.warn('Nenhum modelo encontrado para o grupo, usando dados padrão');
      return [];
    }

  } catch (error) {
    console.error('Erro ao buscar modelos de veículos:', error);
    throw error;
  }
}

// Verificar se a API está online (ping rápido)
export async function pingApi(): Promise<{ status: string; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    console.log('Fazendo ping na API...');
    
    const response = await makeApiRequest(`${API_BASE_URL}/ping`);
    const responseTime = Date.now() - startTime;
    
    if (response.success) {
      return {
        status: 'online',
        responseTime
      };
    } else {
      return {
        status: 'offline',
        responseTime,
        error: 'API não respondeu corretamente ao ping'
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Erro no ping da API:', error);
    
    return {
      status: 'offline',
      responseTime,
      error: error.message || 'Erro desconhecido no ping'
    };
  }
}

// Obter informações detalhadas do sistema
export async function getSystemInfo(): Promise<any> {
  try {
    const [statusTest, connectionTest, pingTest] = await Promise.allSettled([
      makeApiRequest(`${API_BASE_URL}/status`),
      makeApiRequest(`${API_BASE_URL}/test-connection`),
      pingApi()
    ]);

    return {
      apiUrl: API_BASE_URL,
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      tests: {
        status: statusTest.status === 'fulfilled' ? statusTest.value : { error: statusTest.reason?.message },
        connection: connectionTest.status === 'fulfilled' ? connectionTest.value : { error: connectionTest.reason?.message },
        ping: pingTest.status === 'fulfilled' ? pingTest.value : { error: pingTest.reason?.message }
      }
    };

  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
    throw error;
  }
}
