import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';

// Função para buscar cliente por documento
export async function getClientByDocument(document: string) {
  try {
    if (!document) {
      return { success: false, error: 'Documento não fornecido', client: null };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('document', document);

    if (error) {
      console.error("Erro ao buscar cliente por documento:", error);
      return { success: false, error, client: null };
    }

    if (data && data.length > 0) {
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

    if (client.document) {
      const { success, client: existingClient, error } = await getClientByDocument(client.document);
      
      if (!success) {
        console.error("Erro ao verificar cliente existente:", error);
        return { success: false, error };
      }

      if (existingClient) {
        console.log("Cliente já existe, atualizando dados...");
        
        const { data, error: updateError } = await supabase
          .from('clients')
          .update({
            name: client.name,
            email: client.email || existingClient.email,
            phone: client.phone || existingClient.phone,
            document: client.document,
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

// Função para excluir cliente - implementação robusta baseada em delete_quote
export async function deleteClientFromSupabase(clientId: string) {
  try {
    console.log(`🗑️ Iniciando exclusão do cliente ${clientId}...`);
    
    // Verificar primeiro se o cliente possui orçamentos vinculados
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

    // Abordagem 1: Chamar a função RPC diretamente
    const { data, error } = await supabase.rpc('delete_client', { client_id: clientId });
    
    if (!error && data === true) {
      console.log(`✅ Cliente excluído com sucesso via RPC!`);
      return { success: true };
    }
    
    if (error) {
      console.error(`❌ Erro ao deletar cliente ${clientId} via RPC:`, error);
    }

    // Abordagem 2: Tentar excluir diretamente
    console.log(`⚠️ Tentando excluir diretamente...`);
    const { error: directError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
      
    if (!directError) {
      // Verificar se a exclusão foi bem-sucedida
      const { data: checkData } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .maybeSingle();
        
      if (!checkData) {
        console.log(`✅ Cliente exclu��do com sucesso na segunda tentativa!`);
        return { success: true };
      }
    } else {
      console.error(`❌ Erro ao excluir cliente diretamente:`, directError);
    }
    
    // Abordagem 3: Último recurso - múltiplas tentativas com intervalo
    const MAX_RETRIES = 3;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Tentar excluir o cliente
        await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);
          
        // Aguardar um curto período para a operação ser processada
        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
        
        // Verificar se o cliente ainda existe
        const { data } = await supabase
          .from('clients')
          .select('id')
          .eq('id', clientId)
          .maybeSingle();
          
        if (!data) {
          console.log(`✅ Cliente excluído com sucesso na tentativa ${i+1}!`);
          return { success: true };
        } else {
          console.log(`⚠️ Cliente ainda existe no banco. Tentativa ${i+1}/${MAX_RETRIES}`);
          if (i < MAX_RETRIES - 1) {
            console.log(`🔄 Fazendo nova tentativa de exclusão...`);
            // Esperar um tempo crescente entre tentativas (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
          }
        }
      } catch (e) {
        console.error(`❌ Erro na tentativa ${i+1}:`, e);
      }
    }
    
    // Se chegou até aqui, todas as tentativas falharam
    console.error(`❌ Cliente ${clientId} não pôde ser excluído mesmo após múltiplas tentativas`);
    return { 
      success: false, 
      error: { message: "Não foi possível excluir o cliente do banco de dados" } 
    };
  } catch (error) {
    console.error(`❌ Erro inesperado ao excluir cliente ${clientId}:`, error);
    return { success: false, error };
  }
}

// Função para atualizar cliente
export async function updateClientInSupabase(clientId: string, updates: any) {
  try {
    console.log("Atualizando cliente:", { clientId, updates });

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
