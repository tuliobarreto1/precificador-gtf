import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NewQuote from "./pages/NewQuote";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import Clients from "./pages/Clients";
import ClientEdit from "./pages/ClientEdit";
import NewClient from "./pages/NewClient";
import Settings from "./pages/Settings";
import Parameters from "./pages/Parameters";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

// Create a client
const queryClient = new QueryClient();

// Componente para proteger rotas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, adminUser, isLoading } = useAuth();
  const location = useLocation();

  // Se estiver carregando, não faz nada ainda
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  // Se não há usuário autenticado, redirecionar para login
  if (!user && !adminUser) {
    // Redirecionar para a página de login, salvando o caminho atual para redirecionamento após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/orcamento/novo" element={<ProtectedRoute><NewQuote /></ProtectedRoute>} />
              <Route path="/orcamentos" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
              <Route path="/orcamento/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
              <Route path="/editar-orcamento/:id" element={<ProtectedRoute><NewQuote /></ProtectedRoute>} />
              
              {/* Rotas de Clientes */}
              <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/cliente/novo" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
              <Route path="/cliente/:id/editar" element={<ProtectedRoute><ClientEdit /></ProtectedRoute>} />
              
              <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/parametros" element={<ProtectedRoute><Parameters /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              
              {/* Rota padrão para página não encontrada */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
