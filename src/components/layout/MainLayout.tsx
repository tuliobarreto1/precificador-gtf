
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  Users, 
  Car, 
  Settings, 
  Sliders,
  BarChart3,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/auth/UserMenu';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Novo Orçamento', href: '/orcamento/novo', icon: Plus },
    { name: 'Lista de Orçamentos', href: '/orcamentos', icon: FileText },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
    { name: 'Usuários', href: '/usuarios', icon: Users },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Veículos', href: '/veiculos', icon: Car },
    { name: 'Parâmetros', href: '/parametros', icon: Sliders },
    { name: 'Resultados', href: '/resultados', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b">
            <img 
              src="/lovable-uploads/84236534-3718-40d2-a32e-197758066390.png" 
              alt="ASA Rent a Car" 
              className="h-8 mr-3"
            />
            <h1 className="font-semibold text-gray-900">GTF System</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Gerador de Propostas GTF
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
