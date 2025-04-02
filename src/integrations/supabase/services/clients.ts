
import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';

// Função para buscar cliente por documento
export async function getClientByDocument(document: string) {
  try {
    if (!document) {
      return { success: false, error: 'Documento não fornecido', client: null };
    }

    // Removido o .maybeSingle() para tratar múltiplos resultados
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('document', document);

    if (error) {
      console.error("Erro ao buscar cliente por documento:", error);
      return { success: false, error, client: null };
    }

    // Se encontrou múltiplos registros, usar o mais recente
    if (data && data.length > 0) {
      // Ordenar por updated_at e pegar o mais recente
      const mostRecent = data.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      
      console.log("Cliente encontrado pelo documento:", mostRecent);
      return { success: true, client: mostRecent };
    }

    console.log("Nenhum cliente encontrado com o documento:", document);
    return { success: true, client: null };
  } catch (error) {
    console.error("Erro inesperado ao buscar cliente por documento:", error);
    return { success: false, error, client: null };
  }
}

// Função para salvar ou atualizar cliente no Supabase
export async function saveClientToSupabase(client: any) {
  try {
    console.log("Iniciando salvamento/atualização de cliente:", client);

    // Verificar se o cliente tem documento (CPF/CNPJ)
    if (client.document) {
      // Buscar cliente existente pelo documento
      const { success, client: existingClient, error } = await getClientByDocument(client.document);
      
      if (!success) {
        console.error("Erro ao verificar cliente existente:", error);
        return { success: false, error };
      }

      if (existingClient) {
        console.log("Cliente já existe, atualizando dados...");
        
        // Atualizar dados do cliente existente
        const { data, error: updateError } = await supabase
          .from('clients')
          .update({
            name: client.name,
            email: client.email || existingClient.email,
            phone: client.phone || existingClient.phone,
            document: client.document, // Manter o documento original
            updated_at: new Date().toISOString()
          })
          .eq('id', existingClient.id)
          .select()
          .single();

        if (updateError) {
          console.error("Erro ao atualizar cliente:", updateError);
          return { success: false, error: updateError };
        }

        console.log("Cliente atualizado com sucesso:", data);
        return { success: true, data };
      }
    }

    // Se não encontrou cliente existente ou não tem documento, criar novo
    console.log("Criando novo cliente...");
    const { data, error } = await supabase
      .from('clients')
      .insert({
        id: uuidv4(),
        name: client.name,
        document: client.document || null,
        email: client.email || null,
        phone: client.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar novo cliente:", error);
      return { success: false, error };
    }

    console.log("Novo cliente criado com sucesso:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Erro inesperado ao salvar cliente:", error);
    return { success: false, error };
  }
}

// Função para listar todos os clientes
export async function getClientsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Erro ao listar clientes:", error);
      return { success: false, error, clients: [] };
    }

    return { success: true, clients: data || [] };
  } catch (error) {
    console.error("Erro inesperado ao listar clientes:", error);
    return { success: false, error, clients: [] };
  }
}

// Função para excluir cliente - CORRIGIDA E MELHORADA
export async function deleteClientFromSupabase(clientId: string) {
  try {
    console.log(`🗑️ Iniciando exclusão do cliente ${clientId}...`);
    
    // Verificar se o cliente está em uso em algum orçamento
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);
      
    if (quotesError) {
      console.error('❌ Erro ao verificar orçamentos vinculados:', quotesError);
      return { success: false, error: quotesError };
    }
    
    if (quotesData && quotesData.length > 0) {
      console.log('⚠️ Cliente não pode ser excluído - vinculado a orçamentos');
      return { 
        success: false, 
        error: { message: "Este cliente está vinculado a orçamentos e não pode ser excluído." } 
      };
    }

    // Se não estiver em uso, proceder com a exclusão usando o método correto
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      console.error(`❌ Erro ao excluir cliente ${clientId}:`, error);
      return { success: false, error };
    }
    
    // Aumento do tempo de espera para 1.5 segundos para garantir que a operação foi concluída
    console.log(`⏳ Aguardando confirmação da exclusão...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verificar se o cliente foi realmente excluído
    const { data: checkData, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId);
      
    if (checkError) {
      console.error(`❌ Erro ao verificar exclusão do cliente:`, checkError);
      return { success: false, error: checkError };
    }
    
    // Dupla verificação para garantir que o cliente foi excluído
    if (checkData && checkData.length > 0) {
      console.error(`❌ Cliente ${clientId} ainda existe no banco após tentativa de exclusão`);
      
      // Tentativa adicional de exclusão
      console.log(`🔄 Fazendo nova tentativa de exclusão...`);
      const { error: retryError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
        
      if (retryError) {
        console.error(`❌ Erro na segunda tentativa:`, retryError);
        return { 
          success: false, 
          error: { message: "Falha ao excluir o cliente do banco de dados após múltiplas tentativas" } 
        };
      }
      
      // Esperar um pouco mais e verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data: finalCheck } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId);
        
      if (finalCheck && finalCheck.length > 0) {
        console.error(`❌ Cliente ${clientId} não pôde ser excluído mesmo após múltiplas tentativas`);
        return { 
          success: false, 
          error: { message: "Não foi possível excluir o cliente do banco de dados" } 
        };
      }
    }
    
    console.log(`✅ Cliente ${clientId} excluído com sucesso!`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erro inesperado ao excluir cliente ${clientId}:`, error);
    return { success: false, error };
  }
}

// Função para atualizar cliente
export async function updateClientInSupabase(clientId: string, updates: any) {
  try {
    console.log("Atualizando cliente:", { clientId, updates });

    // Se estiver tentando atualizar o documento, verificar se já existe
    if (updates.document) {
      const { client: existingClient } = await getClientByDocument(updates.document);
      if (existingClient && existingClient.id !== clientId) {
        return { 
          success: false, 
          error: { message: 'Já existe um cliente com este documento' }
        };
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cliente:", error);
      return { success: false, error };
    }

    console.log("Cliente atualizado com sucesso:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Erro inesperado ao atualizar cliente:", error);
    return { success: false, error };
  }
}
