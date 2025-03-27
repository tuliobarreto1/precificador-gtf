
import React, { useState } from 'react';
import { MenuIcon, X, BellIcon, UserIcon, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuote } from '@/context/QuoteContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

type TopBarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const TopBar = ({ isSidebarOpen, toggleSidebar }: TopBarProps) => {
  const { getCurrentUser, setCurrentUser, availableUsers, authenticateUser } = useQuote();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Redirecionar para a página de login
    navigate('/login');
  };
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="default" className="ml-2 bg-red-500 hover:bg-red-600">
            Admin
          </Badge>
        );
      case 'manager':
        return (
          <Badge variant="default" className="ml-2 bg-blue-500 hover:bg-blue-600">
            Gerente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="ml-2">
            Usuário
          </Badge>
        );
    }
  };

  return (
    <header className="h-16 fixed top-0 left-0 right-0 z-40 glass border-b border-border">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors"
            aria-label={isSidebarOpen ? "Ocultar menu" : "Exibir menu"}
          >
            {isSidebarOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
          
          <div className="ml-4 flex items-center">
            <div className={cn(
              "text-primary font-medium text-xl transition-all",
              isSidebarOpen ? "opacity-100" : "md:opacity-0"
            )}>
              Precificador GTF
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors">
            <BellIcon size={20} />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <span className="font-medium">{currentUser.name}</span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Trocar Usuário</DropdownMenuLabel>
              {availableUsers.map((user) => (
                <DropdownMenuItem 
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className={`flex items-center justify-between cursor-pointer ${
                    currentUser.id === user.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                  {getRoleBadge(user.role)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
