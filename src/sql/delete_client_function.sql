
-- Esta função deve ser executada no Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.delete_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Excluir o cliente usando uma transação para garantir atomicidade
  BEGIN
    DELETE FROM public.clients
    WHERE id = client_id;
    
    -- Verificar se a exclusão foi bem-sucedida
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro na exclusão do cliente: %', SQLERRM;
    RETURN FALSE;
  END;
END;
$$;
