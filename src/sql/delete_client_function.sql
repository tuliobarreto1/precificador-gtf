
-- Esta função deve ser executada no Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.delete_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_exists BOOLEAN;
  has_quotes BOOLEAN;
BEGIN
  -- Verificar se o cliente existe
  SELECT EXISTS (
    SELECT 1 FROM public.clients WHERE id = client_id
  ) INTO client_exists;
  
  IF NOT client_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o cliente tem orçamentos vinculados
  SELECT EXISTS (
    SELECT 1 FROM public.quotes WHERE client_id = client_id LIMIT 1
  ) INTO has_quotes;
  
  IF has_quotes THEN
    RETURN FALSE;
  END IF;
  
  -- Executar a exclusão dentro de uma transação para garantir atomicidade
  BEGIN
    -- Excluir registros relacionados ao cliente, se houver
    -- Aqui você pode adicionar mais tabelas conforme necessário

    -- Por fim, excluir o cliente
    DELETE FROM public.clients WHERE id = client_id;
    
    -- Verificar se a exclusão foi bem-sucedida
    SELECT NOT EXISTS (
      SELECT 1 FROM public.clients WHERE id = client_id
    ) INTO client_exists;
    
    RETURN NOT client_exists;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro na exclusão do cliente: %', SQLERRM;
      RETURN FALSE;
  END;
END;
$$;
