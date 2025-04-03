
import React, { useState } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuoteFiltersProps {
  loading: boolean;
  onRefresh: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: string | null;
    dateRange: string | null;
    createdBy: string | null;
  };
  onFilterChange: (key: 'status' | 'dateRange' | 'createdBy', value: string | null) => void;
  onClearFilters: () => void;
}

const QuoteFilters = ({ 
  loading, 
  onRefresh, 
  searchTerm, 
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters
}: QuoteFiltersProps) => {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar orçamentos..."
          className="pl-8 h-10 w-full"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button 
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
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
