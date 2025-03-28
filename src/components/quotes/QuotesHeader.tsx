
import React from 'react';
import { Link } from 'react-router-dom';
import { FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTitle from '@/components/ui-custom/PageTitle';

const QuotesHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <PageTitle 
        title="Orçamentos" 
        subtitle="Gerencie todos os seus orçamentos"
      />
      <Link to="/orcamento/novo">
        <Button className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </Link>
    </div>
  );
};

export default QuotesHeader;
