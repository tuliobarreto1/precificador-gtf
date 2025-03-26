
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fadeIn">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-medium text-foreground">Página não encontrada</h2>
          <p className="text-muted-foreground mt-2">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="pt-4">
          <Link to="/">
            <Button variant="default" className="gap-2">
              <ArrowLeft size={16} />
              Voltar para a página inicial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
