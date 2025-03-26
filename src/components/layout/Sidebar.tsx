
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  List, 
  Settings, 
  Users, 
  User, 
  Car, 
  Sliders, 
  PieChart, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = {
  isOpen: boolean;
};

type NavItem = {
  name: string;
  to: string;
  icon: React.ReactNode;
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const navItems: NavItem[] = [
    { name: 'Início', to: '/', icon: <Home size={20} /> },
    { name: 'Novo Orçamento', to: '/orcamento/novo', icon: <FileText size={20} /> },
    { name: 'Lista de Orçamentos', to: '/orcamentos', icon: <List size={20} /> },
    { name: 'Configurações', to: '/configuracoes', icon: <Settings size={20} /> },
    { name: 'Usuários', to: '/usuarios', icon: <Users size={20} /> },
    { name: 'Clientes', to: '/clientes', icon: <User size={20} /> },
    { name: 'Veículos', to: '/veiculos', icon: <Car size={20} /> },
    { name: 'Parâmetros', to: '/parametros', icon: <Sliders size={20} /> },
    { name: 'Resultados', to: '/resultados', icon: <PieChart size={20} /> },
  ];

  return (
    <div 
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-64px)] glass border-r border-border z-30 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <nav className="h-full flex flex-col">
        <div className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.to}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-primary/5 group",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-foreground/70"
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isOpen && (
                    <span className="ml-3 truncate transition-opacity duration-300">{item.name}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
