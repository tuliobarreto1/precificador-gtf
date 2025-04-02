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

// Função para excluir cliente - REESCRITA PARA USAR A NOVA FUNÇÃO SQL
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

    // Chamar a função SQL personalizada para excluir o cliente
    const { data, error } = await supabase.rpc(
      'delete_client',
      { client_id: clientId }
    );

    if (error) {
      console.error(`❌ Erro na exclusão via RPC:`, error);
      
      // Se a função RPC falhar, tentar o método tradicional
      console.log(`🔄 Tentando método tradicional...`);
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (deleteError) {
        console.error(`❌ Erro ao excluir cliente ${clientId}:`, deleteError);
        return { success: false, error: deleteError };
      }
    }
    
    // Verificar se o cliente realmente foi excluído
    console.log(`⏳ Aguardando confirmação da exclusão...`);
    
    // Aguardar um pouco para garantir que a exclusão foi processada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let tentativas = 0;
    const MAX_TENTATIVAS = 3;
    
    while (tentativas < MAX_TENTATIVAS) {
      const { data: checkData, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId);
        
      if (checkError) {
        console.log(`✅ Possível sucesso (erro esperado ao buscar cliente excluído)`);
        return { success: true };
      }
      
      if (!checkData || checkData.length === 0) {
        console.log(`✅ Cliente ${clientId} excluído com sucesso!`);
        return { success: true };
      }
      
      console.log(`⚠️ Cliente ainda existe no banco. Tentativa ${tentativas + 1}/${MAX_TENTATIVAS}`);
      
      // Se o cliente ainda existir, tentar excluí-lo novamente pelo método tradicional
      if (tentativas < MAX_TENTATIVAS - 1) {
        console.log(`🔄 Fazendo nova tentativa de exclusão...`);
        await supabase.from('clients').delete().eq('id', clientId);
        
        // Aguardar mais tempo entre tentativas
        await new Promise(resolve => setTimeout(resolve, 1500 * (tentativas + 1)));
      }
      
      tentativas++;
    }
    
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
