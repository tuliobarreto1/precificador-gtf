
import React, { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SavedQuote, SavedVehicle } from '@/context/types/quoteTypes';
import { QuoteFormData, QuoteCalculationResult } from '@/context/types/quoteTypes';

interface PropostaTemplateProps {
  quote: QuoteFormData | null;
  result: QuoteCalculationResult | null;
  currentDate?: string;
  userName?: string; // Adicionando prop para o nome do usuário
}

const PropostaTemplate = forwardRef<HTMLDivElement, PropostaTemplateProps>(
  ({ quote, result, currentDate, userName = 'Setor Comercial' }, ref) => {
    if (!quote || !result || !quote.client || !quote.vehicles || !result.vehicleResults) {
      console.warn("PropostaTemplate: Dados insuficientes para renderizar proposta", { quote, result });
      return (
        <div ref={ref} className="bg-white p-8 w-[210mm] min-h-[297mm]">
          <p className="text-center text-red-500">
            Dados insuficientes para gerar a proposta. Verifique se o orçamento foi salvo corretamente.
          </p>
        </div>
      );
    }

    const today = currentDate || new Date().toLocaleDateString('pt-BR');
    const clientName = quote.client?.name || 'Cliente';
    const clientDocument = quote.client?.document || '';
    
    // Log para debug
    console.log("Renderizando PropostaTemplate com dados:", { 
      client: quote.client,
      vehicles: quote.vehicles?.length,
      result: result?.vehicleResults?.length,
      globalParams: quote.globalParams,
      userName: userName // Logando o nome do usuário
    });
    
    // Calcular totais com verificações para evitar erros
    const totalMensal = result.vehicleResults?.reduce((sum, vr) => sum + (vr?.totalCost || 0), 0) || 0;
    const totalContrato = totalMensal * (quote.globalParams?.contractMonths || 24);

    return (
      <div 
        ref={ref} 
        className="bg-white w-[210mm] min-h-[297mm]" 
        style={{ 
          fontFamily: 'Arial, sans-serif',
          backgroundImage: "url('/lovable-uploads/a519c899-30fd-4714-b3c3-68efeea95d95.png')",
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",
          position: "relative",
          paddingTop: "20px" // Adicionando padding superior para evitar corte do título
        }}
      >
        <div className="p-8 pt-12"> {/* Aumentando o padding-top para dar mais espaço ao título */}
          {/* Espaço para o cabeçalho que já está na imagem */}
          <div className="h-[180px]"></div>

          {/* Informações da Proposta */}
          <div className="mb-10">
            <p className="text-left mb-6">Recife, {today}</p>
            
            <h1 className="text-center text-xl font-bold mb-10">PROPOSTA COMERCIAL</h1>
            
            <p className="mb-1 font-bold">Ao {clientName}</p>
            <p className="mb-6 text-sm">{clientDocument && `CNPJ/CPF: ${clientDocument}`}</p>
            
            <p className="mb-4 text-sm">
              A <span className="font-bold">ASA RENT A CAR LOCAÇÃO DE VEÍCULOS LTDA</span> – CNPJ: 07.005.206/0001-53, 
              com sede na Rua Padre Carapuceiro, 910, Edifício Acácio Gil Borsoi, Boa Viagem, Recife-PE, 
              vem a esta empresa apresentar nossa proposta para locações de veículos, como segue abaixo:
            </p>
          </div>

          {/* Tabela de Veículos */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 text-xs text-center">ITEM</th>
                  <th className="border p-1 text-xs text-center">MESES</th>
                  <th className="border p-1 text-xs text-center">QTD</th>
                  <th className="border p-1 text-xs text-center">Veículo</th>
                  <th className="border p-1 text-xs text-center">Grupo</th>
                  <th className="border p-1 text-xs text-center">KM/MÊS</th>
                  <th className="border p-1 text-xs text-center">PROTEÇÃO</th>
                  <th className="border p-1 text-xs text-center">VALOR MENSAL</th>
                  <th className="border p-1 text-xs text-center">TOTAL p/ {quote.globalParams?.contractMonths || 24} meses</th>
                </tr>
              </thead>
              <tbody>
                {quote.vehicles && Array.isArray(quote.vehicles) && result.vehicleResults && Array.isArray(result.vehicleResults) && 
                 quote.vehicles.map((vehicle, index) => {
                  // Verificar se o veículo existe
                  if (!vehicle || !vehicle.vehicle) {
                    console.warn("Veículo inválido no índice", index);
                    return null;
                  }
                  
                  // Buscar o resultado correspondente ao veículo atual
                  const vehicleResult = result.vehicleResults.find(vr => vr && vr.vehicleId === vehicle.vehicle.id);
                  if (!vehicleResult) {
                    console.warn("Resultado não encontrado para veículo", vehicle.vehicle.id);
                    return null;
                  }
                  
                  return (
                    <tr key={`vehicle-${index}-${vehicle.vehicle.id}`} className="text-center">
                      <td className="border p-1 text-xs">{index + 1}</td>
                      <td className="border p-1 text-xs">{quote.globalParams?.contractMonths || 24}</td>
                      <td className="border p-1 text-xs">1</td>
                      <td className="border p-1 text-xs">{vehicle.vehicle.brand} {vehicle.vehicle.model}</td>
                      <td className="border p-1 text-xs">{vehicle.vehicleGroup?.name || vehicle.vehicleGroup?.id || 'N/A'}</td>
                      <td className="border p-1 text-xs">{quote.globalParams?.monthlyKm || 3000}</td>
                      <td className="border p-1 text-xs">
                        {vehicleResult.protectionPlanId ? 'Sim' : 'Não'}
                      </td>
                      <td className="border p-1 text-xs">{formatCurrency(vehicleResult.totalCost || 0)}</td>
                      <td className="border p-1 text-xs">{formatCurrency((vehicleResult.totalCost || 0) * (quote.globalParams?.contractMonths || 24))}</td>
                    </tr>
                  );
                }).filter(Boolean)}
                
                <tr className="font-bold bg-gray-50">
                  <td colSpan={7} className="border p-1 text-xs text-right">TOTAL:</td>
                  <td className="border p-1 text-xs text-center">{formatCurrency(totalMensal)}</td>
                  <td className="border p-1 text-xs text-center">{formatCurrency(totalContrato)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detalhes Adicionais */}
          <div className="mb-10">
            <p className="font-bold mb-2">OBJETO: locação de veículos para transporte, sem motorista, sem combustível.</p>
            
            <div className="mt-4">
              <p className="font-bold mb-2">Incluso:</p>
              <ul className="list-none pl-4 text-sm space-y-1">
                <li>Proteção com coparticipação de acordo com o modelo</li>
                <li>Cobertura para terceiros</li>
                <li>Assistência 24 horas</li>
                <li>Manutenções conforme manual do fabricante</li>
                <li>
                  {(quote.globalParams?.includeIpva || quote.globalParams?.includeLicensing) ? 
                    'Impostos, taxas, licenciamento e IPVA' : 'Impostos e taxas'}
                </li>
              </ul>
            </div>
          </div>

          {/* Área de assinatura corrigida - Agora posicionada logo após o texto e com mais espaço */}
          <div className="mb-20"> {/* Aumentado o espaço para separar do rodapé */}
            <p className="mb-4">Validade da proposta: 10 dias.</p>
            <p className="mb-6">Atenciosamente,</p> {/* Aumentado o espaço antes da assinatura */}
            <p className="font-bold">{userName}</p>
            <p>Setor Comercial</p>
          </div>
        </div>

        {/* Rodapé já está na imagem de fundo */}
        <div className="h-[100px]"></div> {/* Aumentado o espaço do rodapé */}
      </div>
    );
  }
);

PropostaTemplate.displayName = 'PropostaTemplate';

export default PropostaTemplate;
