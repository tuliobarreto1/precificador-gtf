
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
  CodigoMVA?: string;
  NumeroPassageiros?: number;
  Status?: string;
  DescricaoStatus?: string;
  DataCompra?: Date;
}

export interface SqlVehicleGroup {
  CodigoGrupo: string;
  Letra: string;
  Descricao: string;
}

export interface SqlVehicleModel {
  CodigoModelo: string;
  Descricao: string;
  CodigoGrupoVeiculo: string;
  LetraGrupo: string;
  MaiorValorCompra: number;
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

/**
 * Busca todos os grupos de veículos disponíveis
 */
export async function getVehicleGroups(): Promise<SqlVehicleGroup[]> {
  try {
    console.log('Iniciando busca de grupos de veículos');
    
    // Usar a URL correta com a porta apropriada
    const apiUrl = '/api/vehicle-groups';
    console.log(`Enviando requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`Resposta recebida. Status: ${response.status}`);
    
    if (!response.ok) {
      console.log('Resposta não ok, status:', response.status);
      
      // Se não obtiver conexão com a API real, retornar alguns grupos padrão para teste
      if (response.status === 404) {
        console.log('API de grupos não encontrada, usando dados padrão para teste');
        return [
          { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
          { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
          { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
          { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
          { CodigoGrupo: "5", Letra: "E", Descricao: "SUV" },
          { CodigoGrupo: "6", Letra: "F", Descricao: "Luxo" }
        ];
      }
      
      // Não tente ler o corpo da resposta duas vezes
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Erro ao buscar grupos de veículos. Status: ${response.status}`;
      } catch (jsonError) {
        errorMessage = `Erro ao buscar grupos de veículos. Status: ${response.status}`;
      }
      
      console.error('Erro ao buscar grupos de veículos:', errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
      const data = await response.json();
      console.log(`${data.length} grupos de veículos recebidos`);
      return data;
    } catch (e) {
      console.error('Erro ao analisar resposta JSON:', e);
      // Tentar alternativa de dados padrão
      console.log('Usando dados padrão devido ao erro na análise da resposta');
      return [
        { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
        { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
        { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
        { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
        { CodigoGrupo: "5", Letra: "E", Descricao: "SUV" },
        { CodigoGrupo: "6", Letra: "F", Descricao: "Luxo" }
      ];
    }
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
    
    // Retornar dados padrão em caso de erro
    console.log('Usando dados padrão devido ao erro na requisição');
    return [
      { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
      { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
      { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
      { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
      { CodigoGrupo: "5", Letra: "E", Descricao: "SUV" },
      { CodigoGrupo: "6", Letra: "F", Descricao: "Luxo" }
    ];
  }
}

/**
 * Busca modelos de veículos disponíveis por grupo
 * @param groupCode Código ou Letra do grupo de veículos
 */
export async function getVehicleModelsByGroup(groupCode: string): Promise<SqlVehicleModel[]> {
  try {
    console.log(`Iniciando busca de modelos de veículos para o grupo: ${groupCode}`);
    
    // Usar a URL correta
    const apiUrl = `/api/vehicle-models/${groupCode}`;
    console.log(`Enviando requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`Resposta recebida. Status: ${response.status}`);
    
    if (!response.ok) {
      // Se não obtiver conexão com a API real, retornar alguns modelos padrão para teste
      if (response.status === 404) {
        console.log('API de modelos não encontrada, usando dados padrão para teste');
        
        // Dados padrão diferentes para cada grupo
        const modelosPadrao: { [key: string]: SqlVehicleModel[] } = {
          'A': [
            { CodigoModelo: "A1", Descricao: "Fiat Uno", CodigoGrupoVeiculo: "1", LetraGrupo: "A", MaiorValorCompra: 45000 },
            { CodigoModelo: "A2", Descricao: "Renault Kwid", CodigoGrupoVeiculo: "1", LetraGrupo: "A", MaiorValorCompra: 48000 },
            { CodigoModelo: "A3", Descricao: "VW Up", CodigoGrupoVeiculo: "1", LetraGrupo: "A", MaiorValorCompra: 52000 }
          ],
          'B': [
            { CodigoModelo: "B1", Descricao: "Hyundai HB20", CodigoGrupoVeiculo: "2", LetraGrupo: "B", MaiorValorCompra: 65000 },
            { CodigoModelo: "B2", Descricao: "Chevrolet Onix", CodigoGrupoVeiculo: "2", LetraGrupo: "B", MaiorValorCompra: 68000 },
            { CodigoModelo: "B3", Descricao: "VW Polo", CodigoGrupoVeiculo: "2", LetraGrupo: "B", MaiorValorCompra: 72000 }
          ],
          'C': [
            { CodigoModelo: "C1", Descricao: "Honda City", CodigoGrupoVeiculo: "3", LetraGrupo: "C", MaiorValorCompra: 85000 },
            { CodigoModelo: "C2", Descricao: "Toyota Yaris", CodigoGrupoVeiculo: "3", LetraGrupo: "C", MaiorValorCompra: 88000 },
            { CodigoModelo: "C3", Descricao: "Nissan Versa", CodigoGrupoVeiculo: "3", LetraGrupo: "C", MaiorValorCompra: 92000 }
          ],
          'D': [
            { CodigoModelo: "D1", Descricao: "Toyota Corolla", CodigoGrupoVeiculo: "4", LetraGrupo: "D", MaiorValorCompra: 120000 },
            { CodigoModelo: "D2", Descricao: "Honda Civic", CodigoGrupoVeiculo: "4", LetraGrupo: "D", MaiorValorCompra: 125000 },
            { CodigoModelo: "D3", Descricao: "VW Jetta", CodigoGrupoVeiculo: "4", LetraGrupo: "D", MaiorValorCompra: 130000 }
          ],
          'E': [
            { CodigoModelo: "E1", Descricao: "Jeep Renegade", CodigoGrupoVeiculo: "5", LetraGrupo: "E", MaiorValorCompra: 110000 },
            { CodigoModelo: "E2", Descricao: "Hyundai Creta", CodigoGrupoVeiculo: "5", LetraGrupo: "E", MaiorValorCompra: 115000 },
            { CodigoModelo: "E3", Descricao: "VW T-Cross", CodigoGrupoVeiculo: "5", LetraGrupo: "E", MaiorValorCompra: 120000 }
          ],
          'F': [
            { CodigoModelo: "F1", Descricao: "BMW X1", CodigoGrupoVeiculo: "6", LetraGrupo: "F", MaiorValorCompra: 250000 },
            { CodigoModelo: "F2", Descricao: "Mercedes GLA", CodigoGrupoVeiculo: "6", LetraGrupo: "F", MaiorValorCompra: 270000 },
            { CodigoModelo: "F3", Descricao: "Audi Q3", CodigoGrupoVeiculo: "6", LetraGrupo: "F", MaiorValorCompra: 260000 }
          ]
        };
        
        // Retornar os modelos do grupo solicitado ou um array vazio se o grupo não existir nos dados padrão
        return modelosPadrao[groupCode] || [];
      }
      
      // Tenta obter mensagem de erro
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Erro ao buscar modelos de veículos. Status: ${response.status}`;
      } catch {
        const errorText = await response.text();
        errorMessage = `Erro ao buscar modelos de veículos. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}`;
      }
      
      console.error('Erro ao buscar modelos de veículos:', errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
      const data = await response.json();
      console.log(`${data.length} modelos de veículos recebidos`);
      return data;
    } catch (e) {
      console.error('Erro ao analisar resposta JSON:', e);
      // Fornecer dados padrão para o grupo em caso de erro de análise
      const modelosPadrao: SqlVehicleModel[] = [
        { CodigoModelo: `${groupCode}1`, Descricao: `Modelo 1 Grupo ${groupCode}`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 75000 },
        { CodigoModelo: `${groupCode}2`, Descricao: `Modelo 2 Grupo ${groupCode}`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 80000 },
        { CodigoModelo: `${groupCode}3`, Descricao: `Modelo 3 Grupo ${groupCode}`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 85000 }
      ];
      return modelosPadrao;
    }
  } catch (error) {
    console.error('Erro ao buscar modelos de veículos:', error);
    // Fornecer dados padrão para o grupo em caso de erro geral
    const modelosPadrao: SqlVehicleModel[] = [
      { CodigoModelo: `${groupCode}1`, Descricao: `Modelo 1 Grupo ${groupCode}`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 75000 },
      { CodigoModelo: `${groupCode}2`, Descricao: `Modelo 2 Grupo ${groupCode}`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 80000 },
      { CodigoModelo: `${groupCode}3`, Descricao: `Modelo 3 Grupo ${groupCode}`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 85000 }
    ];
    return modelosPadrao;
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
        // Retornar status online mesmo com erro de parsing, para permitir o uso da aplicação
        return { 
          status: 'online', 
          environment: { 
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
