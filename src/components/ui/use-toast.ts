
// Redirecionar para o hook real
import { useToast as useToastHook, toast } from "@/hooks/use-toast";

// Re-exportar com os mesmos nomes
export { useToastHook as useToast, toast };
