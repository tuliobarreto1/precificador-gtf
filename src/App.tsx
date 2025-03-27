
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NewQuote from "./pages/NewQuote";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import Settings from "./pages/Settings";
import Parameters from "./pages/Parameters";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import { QuoteProvider } from "./context/QuoteContext";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <QuoteProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/orcamento/novo" element={<NewQuote />} />
              <Route path="/orcamentos" element={<Quotes />} />
              <Route path="/orcamento/:id" element={<QuoteDetail />} />
              <Route path="/editar-orcamento/:id" element={<NewQuote />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/parametros" element={<Parameters />} />
              <Route path="/usuarios" element={<Users />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </QuoteProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
