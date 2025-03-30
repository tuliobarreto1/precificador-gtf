
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import QuotesHeader from '@/components/quotes/QuotesHeader';
import QuoteStats from '@/components/quotes/QuoteStats';
import QuoteFilters from '@/components/quotes/QuoteFilters';
import QuoteEmpty from '@/components/quotes/QuoteEmpty';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/useQuotes';

const Quotes = () => {
  const { 
    allQuotes, 
    totalQuotes, 
    totalValue, 
    avgValue, 
    loading, 
    handleRefresh 
  } = useQuotes();

  return (
    <MainLayout>
      <div className="py-8">
        <QuotesHeader />
        
        <QuoteStats 
          totalQuotes={totalQuotes}
          totalValue={totalValue}
          avgValue={avgValue}
        />
        
        <div className="bg-white shadow rounded-md">
          <QuoteFilters 
            loading={loading} 
            onRefresh={handleRefresh} 
          />
          
          {allQuotes.length === 0 ? (
            <QuoteEmpty />
          ) : (
            <QuoteTable 
              quotes={allQuotes} 
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Quotes;
