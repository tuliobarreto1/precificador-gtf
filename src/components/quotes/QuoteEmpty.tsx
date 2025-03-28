
import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QuoteEmpty = () => {
  return (
    <div className="p-12 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">Nenhum orçamento encontrado</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Crie um novo orçamento para começar
      </p>
      <Link to="/orcamento/novo">
        <Button className="mt-4">
          Criar Orçamento
        </Button>
      </Link>
    </div>
  );
};

export default QuoteEmpty;
