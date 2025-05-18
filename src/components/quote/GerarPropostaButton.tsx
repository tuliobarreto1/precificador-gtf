
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QuoteFormData, QuoteCalculationResult, SavedQuote } from '@/context/types/quoteTypes';
import PropostaTemplate from './PropostaTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { updateQuoteStatus } from '@/lib/status-api';
import { registerProposal } from '@/integrations/supabase/services/proposals';
import { useQuoteCalculation } from '@/hooks/useQuoteCalculation';

interface GerarPropostaButtonProps {
  quoteForm: QuoteFormData | null;
  result: QuoteCalculationResult | null;
  currentQuoteId?: string | null;
  savedQuote?: SavedQuote | null;
}

const GerarPropostaButton: React.FC<GerarPropostaButtonProps> = ({ quoteForm, result, currentQuoteId, savedQuote }) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<QuoteCalculationResult | null>(result);
  const [formattedQuoteForm, setFormattedQuoteForm] = useState<QuoteFormData | null>(quoteForm);
  const propostaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { calculateQuoteSync } = useQuoteCalculation(formattedQuoteForm || { 
    client: null, 
    vehicles: [], 
    useGlobalParams: true,
    globalParams: { 
      contractMonths: 24, 
      monthlyKm: 3000, 
      operationSeverity: 3,
      hasTracking: false,
      protectionPlanId: null,
      includeIpva: true,
      includeLicensing: true, 
      includeTaxes: true 
    } 
  });

  // Quando temos um savedQuote, mas não temos quoteForm, vamos converter o savedQuote para quoteForm
  useEffect(() => {
    // Se já temos resultado e quoteForm válidos, não fazemos nada
    if (result && quoteForm?.client && quoteForm.vehicles?.length > 0) {
      setCalculatedResult(result);
      setFormattedQuoteForm(quoteForm);
      return;
    }

    // Se temos savedQuote, mas não temos quoteForm ou result completos
    if (savedQuote) {
      console.log("Convertendo savedQuote para quoteForm", savedQuote);
      
      const newQuoteForm: QuoteFormData = {
        client: {
          id: savedQuote.clientId || '',
          name: savedQuote.clientName || 'Cliente',
          document: '',
          email: '',
          contact: ''
        },
        vehicles: savedQuote.vehicles?.map(vehicle => ({
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
            contractMonths: vehicle.contractMonths || savedQuote.contractMonths || 24,
            monthlyKm: vehicle.monthlyKm || savedQuote.monthlyKm || 3000,
            operationSeverity: savedQuote.globalParams?.operationSeverity || 3,
            hasTracking: savedQuote.globalParams?.hasTracking || false,
            protectionPlanId: vehicle.protectionPlanId || null,
            includeIpva: vehicle.includeIpva || savedQuote.globalParams?.includeIpva || false,
            includeLicensing: vehicle.includeLicensing || savedQuote.globalParams?.includeLicensing || false,
            includeTaxes: vehicle.includeTaxes || savedQuote.globalParams?.includeTaxes || false
          }
        })) || [],
        useGlobalParams: true,
        globalParams: {
          contractMonths: savedQuote.contractMonths || 24,
          monthlyKm: savedQuote.monthlyKm || 3000,
          operationSeverity: savedQuote.globalParams?.operationSeverity || 3,
          hasTracking: savedQuote.globalParams?.hasTracking || false,
          protectionPlanId: null,
          includeIpva: savedQuote.globalParams?.includeIpva || false,
          includeLicensing: savedQuote.globalParams?.includeLicensing || false,
          includeTaxes: savedQuote.globalParams?.includeTaxes || false
        }
      };

      setFormattedQuoteForm(newQuoteForm);
      
      // Calcular o resultado usando a função de cálculo
      try {
        const newResult = calculateQuoteSync();
        console.log("Resultado calculado para o savedQuote:", newResult);
        setCalculatedResult(newResult);
      } catch (error) {
        console.error("Erro ao calcular resultado:", error);
      }
    }
  }, [savedQuote, quoteForm, result, calculateQuoteSync]);

  // Verificar se os dados são válidos para gerar a proposta
  const dadosValidos = Boolean(
    (formattedQuoteForm?.client && 
     formattedQuoteForm.vehicles && 
     formattedQuoteForm.vehicles.length > 0 &&
     calculatedResult?.vehicleResults && 
     calculatedResult.vehicleResults.length > 0 && 
     currentQuoteId)
  );

  // Log detalhado para debug
  console.log("GerarPropostaButton: Estado atual dos dados", {
    cliente: formattedQuoteForm?.client,
    veiculos: formattedQuoteForm?.vehicles?.map(v => ({
      id: v.vehicle.id,
      marca: v.vehicle.brand,
      modelo: v.vehicle.model
    })),
    resultados: calculatedResult?.vehicleResults?.map(v => ({
      id: v.vehicleId,
      custo: v.totalCost
    })),
    id_orcamento: currentQuoteId,
    dados_validos: dadosValidos
  });

  const handleGeneratePDF = async () => {
    if (!propostaRef.current) {
      toast({
        title: "Erro ao gerar proposta",
        description: "Não foi possível gerar a proposta. Elemento de referência não encontrado.",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentQuoteId) {
      toast({
        title: "Erro ao gerar proposta",
        description: "Não foi possível gerar a proposta. ID do orçamento não informado. Verifique se o orçamento foi salvo.",
        variant: "destructive"
      });
      console.error("Tentativa de gerar PDF sem ID de orçamento válido", { currentQuoteId });
      return;
    }

    setIsGenerating(true);
    try {
      // Criar nome do arquivo baseado no cliente
      const fileName = `Proposta_${formattedQuoteForm?.client?.name?.replace(/\s+/g, '_') || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      toast({
        title: "Gerando PDF",
        description: "Aguarde enquanto geramos a proposta em PDF...",
      });

      console.log("Iniciando geração do PDF do elemento:", propostaRef.current);
      
      const element = propostaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: true, // Ativar logs para debug
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      console.log("Canvas gerado com sucesso");
      
      // Configurar orientação e tamanho (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // Largura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      console.log("Imagem adicionada ao PDF");
      
      // Salvar PDF como blob para upload
      const pdfBlob = pdf.output('blob');
      
      // 1. Atualizar o status do orçamento para PROPOSTA_GERADA
      setIsUpdatingStatus(true);
      console.log("Atualizando status do orçamento:", currentQuoteId);
      const statusUpdateResult = await updateQuoteStatus(
        currentQuoteId, 
        'PROPOSTA_GERADA', 
        'Proposta gerada automaticamente pelo sistema'
      );
      
      if (!statusUpdateResult.success) {
        console.error('Erro ao atualizar status:', statusUpdateResult.error);
        toast({
          title: "Erro ao atualizar status",
          description: "A proposta foi gerada, mas não foi possível atualizar o status do orçamento.",
          variant: "destructive"
        });
      } else {
        console.log("Status atualizado com sucesso");
      }
      setIsUpdatingStatus(false);
      
      // 2. Salvar registro da proposta no banco
      const currentUser = (await supabase.auth.getUser()).data.user;
      console.log("Salvando registro da proposta:", { 
        quote_id: currentQuoteId,
        user: currentUser 
      });
      
      const registerResult = await registerProposal({
        quote_id: currentQuoteId,
        file_name: fileName,
        generated_by: currentUser?.id || null,
        status: 'GERADA',
        observation: 'Proposta gerada via sistema'
      });
        
      if (!registerResult.success) {
        console.error('Erro ao registrar proposta:', registerResult.error);
        toast({
          title: "Erro ao registrar proposta",
          description: "A proposta foi gerada, mas não foi possível registrar no sistema.",
          variant: "destructive"
        });
      } else {
        console.log('Proposta registrada com sucesso:', registerResult.proposal);
      }
      
      // Salvar o PDF localmente
      pdf.save(fileName);
      
      toast({
        title: "Proposta gerada com sucesso!",
        description: `O arquivo ${fileName} foi salvo e o status atualizado para "Proposta Gerada".`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um problema ao gerar o arquivo PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setIsUpdatingStatus(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full"
          disabled={!formattedQuoteForm?.client}
        >
          <FileText size={16} />
          Gerar Proposta em PDF
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Proposta</DialogTitle>
        </DialogHeader>
        
        {!dadosValidos && (
          <div className="p-4 bg-amber-100 border border-amber-300 rounded-md text-amber-800 mb-4">
            <p className="font-medium">Dados insuficientes para gerar a proposta:</p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              {!currentQuoteId && <li>O orçamento precisa ser salvo primeiro (ID não encontrado)</li>}
              {!formattedQuoteForm?.client && <li>Nenhum cliente selecionado</li>}
              {(!formattedQuoteForm?.vehicles || formattedQuoteForm.vehicles.length === 0) && <li>Nenhum veículo adicionado ao orçamento</li>}
              {(!calculatedResult?.vehicleResults || calculatedResult.vehicleResults.length === 0) && <li>Cálculos dos veículos não encontrados</li>}
            </ul>
            <p className="mt-2 text-sm">Salve o orçamento e tente novamente.</p>
          </div>
        )}
        
        <div className="border rounded-md p-2 bg-gray-50 overflow-auto">
          <div className="flex justify-center">
            <PropostaTemplate ref={propostaRef} quote={formattedQuoteForm} result={calculatedResult} />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGeneratePDF} 
            disabled={isGenerating || isUpdatingStatus || !dadosValidos}
            className="gap-2"
          >
            {isGenerating || isUpdatingStatus ? (
              <>
                <span className="animate-spin">◌</span>
                {isGenerating ? "Gerando PDF..." : "Atualizando status..."}
              </>
            ) : (
              <>
                <FileText size={16} />
                Gerar e Atualizar Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GerarPropostaButton;
