
import React from 'react';
import { MenuIcon, X, BellIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type TopBarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const TopBar = ({ isSidebarOpen, toggleSidebar }: TopBarProps) => {
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
          
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors">
            <UserIcon size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
