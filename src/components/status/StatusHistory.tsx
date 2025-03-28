
import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusHistoryItem, statusInfo } from '@/lib/status-flow';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';
import { fetchStatusHistory } from '@/lib/status-api';

interface StatusHistoryProps {
  history?: StatusHistoryItem[];
  quoteId?: string;
  className?: string;
}

const StatusHistory: React.FC<StatusHistoryProps> = ({ history: initialHistory, quoteId, className }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  
  // Se quoteId for fornecido, buscar histórico da API
  useEffect(() => {
    if (quoteId) {
      setLoading(true);
      fetchStatusHistory(quoteId)
        .then(data => {
          setHistory(data);
        })
        .catch(error => {
          console.error("Erro ao buscar histórico de status:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (initialHistory) {
      // Se history foi passado diretamente como prop
      setHistory(initialHistory);
    }
  }, [quoteId, initialHistory]);
  
  // Ordenar o histórico pelo mais recente
  const sortedHistory = [...(history || [])].sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Histórico de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (sortedHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Histórico de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum histórico de alteração de status disponível.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Histórico de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHistory.map((item, index) => {
            const formattedDate = format(
              new Date(item.changed_at),
              "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
              { locale: ptBR }
            );
            
            return (
              <div key={item.id} className="relative">
                <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span className="text-sm font-medium">{formattedDate}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.user_name ? `Por: ${item.user_name}` : 'Por: Sistema'}
                  </div>
                </div>
                
                <div className="ml-4 pl-4 border-l border-muted">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <div className="text-sm">
                      Status alterado de:
                    </div>
                    {item.previous_status ? (
                      <StatusBadge 
                        status={item.previous_status} 
                        size="sm"
                        className="w-fit"
                      />
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        Inicial
                      </span>
                    )}
                    <div className="text-sm">para:</div>
                    <StatusBadge 
                      status={item.new_status} 
                      size="sm"
                      className="w-fit"
                    />
                  </div>
                  
                  {item.observation && (
                    <div className="mt-2 text-sm bg-muted/30 p-2 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Observação:</p>
                      <p>{item.observation}</p>
                    </div>
                  )}
                </div>
                
                {index < sortedHistory.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusHistory;
