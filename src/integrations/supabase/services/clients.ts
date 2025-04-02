
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
