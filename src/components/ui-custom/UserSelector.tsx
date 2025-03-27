
import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuote, User as UserType } from '@/context/QuoteContext';

const UserSelector = () => {
  const { getCurrentUser, setCurrentUser, availableUsers } = useQuote();
  const currentUser = getCurrentUser();
  
  const handleUserChange = (user: UserType) => {
    setCurrentUser(user);
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

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getUserInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col mr-1">
            <span className="text-sm font-medium">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground flex items-center">
              {currentUser.role === 'admin' ? 'Administrador' : 
               currentUser.role === 'manager' ? 'Gerente' : 'Usuário'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Trocar Usuário</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableUsers.map((user) => (
          <DropdownMenuItem 
            key={user.id}
            onClick={() => handleUserChange(user)}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserSelector;
