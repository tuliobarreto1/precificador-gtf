
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { QuoteProvider } from '@/context/QuoteContext';
import QuoteForm from '@/components/quote/QuoteForm';

const NewQuote = () => {
  // Adicionando console.log para verificar renderização da página
  console.log("Renderizando página NewQuote");
  
  useEffect(() => {
    // Log adicional ao montar o componente para depuração
    console.log("NewQuote montado - verificando configurações de impostos");
    
    // Verificar configurações globais de impostos para depuração
    console.log("Verificando se há configuração global de impostos definida");
  }, []);
  
  return (
    <MainLayout>
      <QuoteProvider>
        <PageTitle
          title="Criar orçamento"
          breadcrumbs={[
            { label: "Home", url: "/" },
            { label: "Orçamentos", url: "/orcamentos" },
            { label: "Novo Orçamento", url: "/orcamento/novo" }
          ]}
        />
        
        <QuoteForm />
      </QuoteProvider>
    </MainLayout>
  );
};

export default NewQuote;
