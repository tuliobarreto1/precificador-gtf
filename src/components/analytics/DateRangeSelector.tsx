
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from 'lucide-react';

interface DateRangeSelectorProps {
  dateRange: { start: Date | null, end: Date | null };
  onDateRangeChange: (range: { start: Date | null, end: Date | null }) => void;
  className?: string; // Adicionado como propriedade opcional
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ dateRange, onDateRangeChange, className }) => {
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    dateRange.start ? new Date(dateRange.start) : undefined
  );
  
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    dateRange.end ? new Date(dateRange.end) : undefined
  );

  const handleRangeSelect = (name: 'start' | 'end') => (date: Date | undefined) => {
    if (name === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };
  
  const applyFilter = () => {
    onDateRangeChange({
      start: startDate || null,
      end: endDate || null
    });
  };
  
  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start);
    setEndDate(end);
    
    onDateRangeChange({
      start,
      end
    });
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-wrap items-center justify-between p-4 gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickFilter(7)}
          >
            Últimos 7 dias
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickFilter(30)}
          >
            Últimos 30 dias
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickFilter(90)}
          >
            Últimos 3 meses
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickFilter(365)}
          >
            Último ano
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="grid gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-from"
                  variant="outline"
                  size="sm"
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "P", { locale: ptBR })
                  ) : (
                    <span>Selecione a data inicial</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleRangeSelect('start')}
                  disabled={(date) =>
                    (endDate ? date > endDate : false) || date > new Date()
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-to"
                  variant="outline"
                  size="sm"
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "P", { locale: ptBR })
                  ) : (
                    <span>Selecione a data final</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleRangeSelect('end')}
                  disabled={(date) =>
                    (startDate ? date < startDate : false) || date > new Date()
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={applyFilter}>Aplicar</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeSelector;
