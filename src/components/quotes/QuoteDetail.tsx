
import React, { useState } from 'react';
import { SavedQuote } from '@/context/types/quoteTypes';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { EmailDialog } from '@/components/quote/EmailDialog';
import GerarPropostaButton from '@/components/quote/GerarPropostaButton';
import { useQuote } from '@/context/QuoteContext';
import { QuoteStatusFlow } from '@/lib/status-flow';
import VehicleDetailCard from './VehicleDetailCard';
import ContractDetailsCard from './ContractDetailsCard';
import StatusCard from './StatusCard';

interface QuoteDetailProps {
  quote: SavedQuote;
  onSendEmail: (email: string, message: string) => Promise<boolean>;
  onDelete: () => void;
  onEdit: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const QuoteDetail: React.FC<QuoteDetailProps> = ({ 
  quote, 
  onSendEmail, 
  onDelete,
  onEdit,
  canEdit,
  canDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { calculateQuote } = useQuote();
  
  console.log("Dados da cotação recebidos no QuoteDetail:", quote);
  
  // Calcular resultado para usar no GerarPropostaButton
  const result = calculateQuote();
  
  // Preparar os dados para o GerarPropostaButton
  const quoteForm = {
    client: {
      id: quote.clientId || '',
      name: quote.clientName || 'Cliente',
      document: '',
      email: '',
      contact: ''
    },
    vehicles: quote.vehicles?.map(vehicle => ({
      vehicle: {
        id: vehicle.vehicleId,
        brand: vehicle.vehicleBrand,
        model: vehicle.vehicleModel,
        year: new Date().getFullYear(),
        value: vehicle.vehicleValue || 0,
        isUsed: !!vehicle.plateNumber,
        plateNumber: vehicle.plateNumber,
        groupId: vehicle.vehicleGroupId || vehicle.groupId || 'A'
      },
      vehicleGroup: {
        id: vehicle.vehicleGroupId || vehicle.groupId || 'A',
        name: `Grupo ${vehicle.vehicleGroupId || vehicle.groupId || 'A'}`,
        description: '',
        revisionKm: 10000,
        revisionCost: 300,
        tireKm: 40000,
        tireCost: 1200
      },
      params: {
        contractMonths: vehicle.contractMonths || quote.contractMonths || 24,
        monthlyKm: vehicle.monthlyKm || quote.monthlyKm || 3000,
        operationSeverity: (vehicle.operationSeverity || quote.globalParams?.operationSeverity || 3) as 1|2|3|4|5|6,
        hasTracking: vehicle.hasTracking ?? quote.globalParams?.hasTracking ?? false,
        protectionPlanId: vehicle.protectionPlanId || null,
        includeIpva: vehicle.includeIpva ?? quote.globalParams?.includeIpva ?? false,
        includeLicensing: vehicle.includeLicensing ?? quote.globalParams?.includeLicensing ?? false,
        includeTaxes: vehicle.includeTaxes ?? quote.globalParams?.includeTaxes ?? false
      }
    })) || [],
    useGlobalParams: true,
    globalParams: {
      contractMonths: quote.contractMonths || 24,
      monthlyKm: quote.monthlyKm || 3000,
      operationSeverity: (quote.globalParams?.operationSeverity || 3) as 1|2|3|4|5|6,
      hasTracking: quote.globalParams?.hasTracking || false,
      protectionPlanId: quote.globalParams?.protectionPlanId || null,
      includeIpva: quote.globalParams?.includeIpva || false,
      includeLicensing: quote.globalParams?.includeLicensing || false,
      includeTaxes: quote.globalParams?.includeTaxes || false
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{quote.clientName}</h2>
          <p className="text-sm text-muted-foreground">
            Criado em {formatDate(quote.createdAt)} 
            {quote.createdBy && ` por ${quote.createdBy.name}`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <EmailDialog quoteId={quote.id} />
          
          <GerarPropostaButton
            quoteForm={quoteForm}
            result={result}
            currentQuoteId={quote.id}
            savedQuote={quote}
          />
          
          {canEdit && (
            <Button 
              variant="default" 
              onClick={onEdit}
            >
              Editar Orçamento
            </Button>
          )}
          
          {canDelete && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ContractDetailsCard quote={quote} />
        <StatusCard 
          quoteId={quote.id} 
          currentStatus={quote.status as QuoteStatusFlow || 'draft'} 
        />
      </div>
      
      <h3 className="text-xl font-bold mt-6">Veículos ({quote.vehicles?.length || 0})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quote.vehicles && quote.vehicles.map(vehicle => (
          <VehicleDetailCard 
            key={vehicle.vehicleId} 
            vehicle={vehicle} 
            contractMonths={quote.contractMonths || 24}
          />
        ))}
      </div>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Excluir Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteDetail;
