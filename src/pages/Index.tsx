
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { QuoteItem, User } from '@/context/types/quoteTypes';
import QuoteTable from '@/components/quotes/QuoteTable';
import QuoteStats from '@/components/quotes/QuoteStats';
import Card from '@/components/ui-custom/Card';
import { ArrowDownRight, ArrowUpRight, FileText, Clock, Plus } from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';

const Index = () => {
  const { user, adminUser } = useAuth();
  const { 
    allQuotes, 
    filteredQuotes, 
    totalQuotes, 
    totalValue, 
    avgValue, 
    loading, 
    error,
    handleRefresh
  } = useQuotes();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          Carregando dashboard...
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full text-red-500">
          Erro: {error}
        </div>
      </MainLayout>
    );
  }

  // Filtrar orçamentos recentes (últimos 5)
  const recentQuotes = [...allQuotes].slice(0, 5);

  return (
    <MainLayout>
      <PageTitle title="Dashboard" subtitle="Acompanhe seus orçamentos e estatísticas" />

      <div className="space-y-6">
        {/* Estatísticas */}
        <QuoteStats 
          totalQuotes={totalQuotes} 
          totalValue={totalValue} 
          avgValue={avgValue} 
        />

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link to="/orcamento/novo">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
          <Link to="/orcamentos">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ver Todos Orçamentos
            </Button>
          </Link>
        </div>

        {/* Orçamentos recentes */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Orçamentos Recentes</h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <Clock className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          
          <div className="rounded-md border">
            <QuoteTable 
              quotes={recentQuotes.map(quote => {
                // Garantir que createdBy seja do tipo correto
                return {
                  ...quote,
                  createdBy: quote.createdBy ? {
                    id: String(quote.createdBy.id), // Garantir que id seja string
                    name: quote.createdBy.name || "Sistema",
                    role: quote.createdBy.role || "system"
                  } : {
                    id: "system",
                    name: "Sistema",
                    role: "system"
                  }
                };
              })}
              onRefresh={handleRefresh} 
            />
          </div>
          
          {recentQuotes.length > 0 && (
            <div className="mt-4 text-right">
              <Link to="/orcamentos">
                <Button variant="link">Ver todos os orçamentos →</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
