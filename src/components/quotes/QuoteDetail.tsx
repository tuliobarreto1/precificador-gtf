
import React, { useState } from 'react';
import { SavedQuote, SavedVehicle } from '@/context/types/quoteTypes';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTaxIndices } from '@/hooks/useTaxIndices';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface QuoteDetailProps {
  quote: SavedQuote;
  onSendEmail: (email: string, message: string) => Promise<void>;
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
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { getTaxBreakdown } = useTaxIndices();
  
  const handleSendEmail = async () => {
    if (!email) return;
    
    setSending(true);
    try {
      await onSendEmail(email, message);
      setShowEmailDialog(false);
      setEmail('');
      setMessage('');
    } finally {
      setSending(false);
    }
  };
  
  // Verificar se existem impostos nos veículos
  const hasAnyTax = quote.vehicles.some(v => 
    (v.includeIpva && v.ipvaCost && v.ipvaCost > 0) || 
    (v.includeLicensing && v.licensingCost && v.licensingCost > 0) || 
    (v.includeTaxes && v.taxCost && v.taxCost > 0)
  );
  
  // Calcular total de impostos para cada veículo
  const calculateVehicleTaxes = (vehicle: SavedVehicle): number => {
    let total = 0;
    if (vehicle.includeIpva && vehicle.ipvaCost) total += vehicle.ipvaCost;
    if (vehicle.includeLicensing && vehicle.licensingCost) total += vehicle.licensingCost;
    if (vehicle.includeTaxes && vehicle.taxCost) total += vehicle.taxCost;
    return total;
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
          <Button 
            variant="outline" 
            onClick={() => setShowEmailDialog(true)}
          >
            Enviar por Email
          </Button>
          
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
      
      <Card>
        <CardHeader title="Dados do Contrato" />
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Valor Total</h3>
            <p className="text-2xl font-bold">{formatCurrency(quote.totalValue)} <span className="text-sm font-normal">/ mês</span></p>
            {quote.contractMonths && (
              <p className="text-sm text-muted-foreground">
                Contrato de {quote.contractMonths} meses - 
                Total: {formatCurrency(quote.totalValue * quote.contractMonths)}
              </p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium">Detalhes</h3>
            <div className="text-sm space-y-1">
              <p>Status: <span className="font-medium">{quote.status}</span></p>
              {quote.globalParams && (
                <>
                  <p>Km mensal: {quote.globalParams.monthlyKm} km</p>
                  <p>Severidade: {quote.globalParams.operationSeverity}</p>
                  <p>Rastreamento: {quote.globalParams.hasTracking ? 'Sim' : 'Não'}</p>
                  <p>IPVA: {quote.globalParams.includeIpva ? 'Incluído' : 'Não incluído'}</p>
                  <p>Licenciamento: {quote.globalParams.includeLicensing ? 'Incluído' : 'Não incluído'}</p>
                  <p>Custos financeiros: {quote.globalParams.includeTaxes ? 'Incluídos' : 'Não incluídos'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      <h3 className="text-xl font-bold mt-6">Veículos ({quote.vehicles.length})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quote.vehicles.map(vehicle => (
          <VehicleDetailCard 
            key={vehicle.vehicleId} 
            vehicle={vehicle} 
            contractMonths={quote.contractMonths || 24}
          />
        ))}
      </div>
      
      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar orçamento por email</DialogTitle>
            <DialogDescription>
              Insira o endereço de email para enviar este orçamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="cliente@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Adicione uma mensagem personalizada ao email..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={!email || sending}>
              {sending ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
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

interface VehicleDetailCardProps {
  vehicle: SavedVehicle;
  contractMonths: number;
}

const VehicleDetailCard: React.FC<VehicleDetailCardProps> = ({ vehicle, contractMonths }) => {
  const { getTaxBreakdown } = useTaxIndices();
  const [taxDetailsOpen, setTaxDetailsOpen] = useState(false);
  
  // Verificar se deve mostrar detalhes de impostos
  const showTaxDetails = vehicle.includeTaxes && vehicle.taxCost !== undefined && vehicle.taxCost > 0;
  
  // Calcular total de impostos
  const totalTaxes = (
    (vehicle.includeIpva && vehicle.ipvaCost ? vehicle.ipvaCost : 0) + 
    (vehicle.includeLicensing && vehicle.licensingCost ? vehicle.licensingCost : 0) + 
    (vehicle.includeTaxes && vehicle.taxCost ? vehicle.taxCost : 0)
  );
  
  // Obter breakdown dos impostos
  let taxBreakdown = null;
  if (showTaxDetails && vehicle.vehicleValue && vehicle.contractMonths) {
    taxBreakdown = getTaxBreakdown(vehicle.vehicleValue, vehicle.contractMonths);
  }
  
  // Verificar se há algum imposto incluído
  const hasTaxes = (vehicle.includeIpva && vehicle.ipvaCost && vehicle.ipvaCost > 0) || 
                  (vehicle.includeLicensing && vehicle.licensingCost && vehicle.licensingCost > 0) || 
                  (vehicle.includeTaxes && vehicle.taxCost && vehicle.taxCost > 0);
  
  return (
    <Card className="p-4">
      <h4 className="text-lg font-medium">{vehicle.vehicleBrand} {vehicle.vehicleModel}</h4>
      {vehicle.plateNumber && (
        <p className="text-sm mb-2">Placa: {vehicle.plateNumber}</p>
      )}
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Valor mensal:</span>
          <span className="font-medium">{formatCurrency(vehicle.totalCost)}</span>
        </div>
        
        {vehicle.monthlyKm && (
          <div className="flex justify-between text-sm">
            <span>Quilometragem:</span>
            <span>{vehicle.monthlyKm} km/mês</span>
          </div>
        )}
        
        {vehicle.contractMonths && (
          <div className="flex justify-between text-sm">
            <span>Prazo:</span>
            <span>{vehicle.contractMonths} meses</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Depreciação:</span>
          <span>{formatCurrency(vehicle.depreciationCost || 0)}/mês</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Manutenção:</span>
          <span>{formatCurrency(vehicle.maintenanceCost || 0)}/mês</span>
        </div>
        
        {vehicle.protectionCost !== undefined && vehicle.protectionCost > 0 && (
          <div className="flex justify-between text-sm">
            <span>Proteção:</span>
            <span>{formatCurrency(vehicle.protectionCost)}/mês</span>
          </div>
        )}
        
        {/* Seção de Impostos e Taxas */}
        {hasTaxes && (
          <Collapsible className="border-t border-b py-2 my-2">
            <div className="flex justify-between items-center">
              <CollapsibleTrigger className="flex items-center text-primary font-medium hover:underline text-sm">
                <span>Impostos e taxas:</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </CollapsibleTrigger>
              <span className="text-sm">{formatCurrency(totalTaxes)}/mês</span>
            </div>
            
            <CollapsibleContent className="pt-2">
              <div className="text-xs space-y-1 text-muted-foreground bg-slate-50 p-2 rounded-md">
                {vehicle.includeIpva && vehicle.ipvaCost && vehicle.ipvaCost > 0 && (
                  <div className="flex justify-between">
                    <span>IPVA:</span>
                    <span>{formatCurrency(vehicle.ipvaCost)}/mês</span>
                  </div>
                )}
                
                {vehicle.includeLicensing && vehicle.licensingCost && vehicle.licensingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Licenciamento:</span>
                    <span>{formatCurrency(vehicle.licensingCost)}/mês</span>
                  </div>
                )}
                
                {vehicle.includeTaxes && vehicle.taxCost && vehicle.taxCost > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Custos financeiros:</span>
                      <span>{formatCurrency(vehicle.taxCost)}/mês</span>
                    </div>
                    
                    {taxBreakdown && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between">
                          <span>Taxa SELIC ({vehicle.contractMonths >= 24 ? '24 meses' : vehicle.contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
                          <span>{taxBreakdown.selicRate.toFixed(2)}% a.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spread financeiro:</span>
                          <span>{taxBreakdown.spread.toFixed(2)}% a.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa total anual:</span>
                          <span>{taxBreakdown.totalTaxRate.toFixed(2)}% a.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo anual:</span>
                          <span>{formatCurrency(taxBreakdown.annualCost)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
      
      <div className="mt-4 pt-2 border-t flex justify-between">
        <span className="font-medium">Total:</span>
        <span className="font-bold">{formatCurrency(vehicle.totalCost)}/mês</span>
      </div>
      
      {vehicle.protectionPlanId && (
        <div className="mt-3 pt-1">
          <div className="flex items-center text-sm">
            <Shield className="h-4 w-4 mr-1 text-green-600" />
            <span className="text-muted-foreground">Proteção incluída</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuoteDetail;
