
import React from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuoteFiltersProps {
  loading: boolean;
  onRefresh: () => void;
}

const QuoteFilters = ({ loading, onRefresh }: QuoteFiltersProps) => {
  return (
    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar orçamentos..."
          className="pl-8 h-10 w-full border rounded-md"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={onRefresh}
          disabled={loading}
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  );
};

export default QuoteFilters;
