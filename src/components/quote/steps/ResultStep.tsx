import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuoteContext } from '@/context/QuoteContext';
import GerarPropostaButton from '../GerarPropostaButton';
import EmailDialog from '../EmailDialog';
import RoicSlider from '../RoicSlider';
import ProposalHistory from '../ProposalHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResultStepProps {
  onPrevious: () => void;
  offlineMode?: boolean;
}

const ResultStep: React.FC<ResultStepProps> = ({ onPrevious, offlineMode = false }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="roic">ROIC</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Detalhes da Cotação</h3>
                {/* Componentes de resumo */}
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Ações</h3>
                <div className="space-y-3">
                  <GerarPropostaButton offlineMode={offlineMode} />
                  <EmailDialog />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roic" className="mt-4">
            <RoicSlider />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ProposalHistory offlineMode={offlineMode} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-start mt-6">
          <Button 
            onClick={onPrevious}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultStep;
