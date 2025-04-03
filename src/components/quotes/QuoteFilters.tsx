
import React, { useState } from 'react';
import { Filter, RotateCcw, Search, X, ArrowUpDown, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { allStatusFlow } from '@/lib/status-flow';

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
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

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
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground" variant="secondary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium">Filtrar Orçamentos</h4>
              
              <div>
                <Label htmlFor="status" className="text-muted-foreground">Status</Label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) => onFilterChange('status', value || null)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    {allStatusFlow.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateRange" className="text-muted-foreground">Período</Label>
                <Select
                  value={filters.dateRange || ""}
                  onValueChange={(value) => onFilterChange('dateRange', value || null)}
                >
                  <SelectTrigger id="dateRange" className="w-full">
                    <SelectValue placeholder="Qualquer período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="createdBy" className="text-muted-foreground">Criado por</Label>
                <Select
                  value={filters.createdBy || ""}
                  onValueChange={(value) => onFilterChange('createdBy', value || null)}
                >
                  <SelectTrigger id="createdBy" className="w-full">
                    <SelectValue placeholder="Qualquer usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer usuário</SelectItem>
                    <SelectItem value="current">Meus orçamentos</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onClearFilters}
                >
                  Limpar filtros
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setPopoverOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
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
