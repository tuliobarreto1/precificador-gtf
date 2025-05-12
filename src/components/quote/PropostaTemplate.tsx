
import React, { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SavedQuote, SavedVehicle } from '@/context/types/quoteTypes';
import { QuoteFormData, QuoteCalculationResult } from '@/context/types/quoteTypes';

interface PropostaTemplateProps {
  quote: QuoteFormData | null;
  result: QuoteCalculationResult | null;
  currentDate?: string;
}

const PropostaTemplate = forwardRef<HTMLDivElement, PropostaTemplateProps>(
  ({ quote, result, currentDate }, ref) => {
    if (!quote || !result) return null;

    const today = currentDate || new Date().toLocaleDateString('pt-BR');
    const clientName = quote.client?.name || 'Cliente';
    const clientDocument = quote.client?.document || '';
    
    // Calcular totais
    const totalMensal = result.vehicleResults.reduce((sum, vr) => sum + vr.totalCost, 0);
    const totalContrato = totalMensal * (quote.globalParams?.contractMonths || 24);

    return (
      <div ref={ref} className="bg-white p-8 w-[210mm] min-h-[297mm]" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-gray-200 via-yellow-300 to-yellow-500 p-4 rounded-lg flex justify-between items-center mb-10">
          <div className="flex items-center">
            <div className="mr-4">
              <div className="text-red-600 font-bold text-3xl">ASA</div>
              <div className="text-black text-sm">RENT A CAR</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-yellow-800 font-medium">SOLUÇÕES COMPLETAS EM</div>
            <div className="text-lg font-bold text-yellow-800">MOBILIDADE</div>
          </div>
        </div>

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
              {quote.vehicles && result.vehicleResults && quote.vehicles.map((vehicle, index) => {
                const vehicleResult = result.vehicleResults.find(vr => vr.vehicleId === vehicle.vehicle.id);
                if (!vehicleResult) return null;
                
                return (
                  <tr key={vehicle.vehicle.id} className="text-center">
                    <td className="border p-1 text-xs">{index + 1}</td>
                    <td className="border p-1 text-xs">{quote.globalParams?.contractMonths || 24}</td>
                    <td className="border p-1 text-xs">1</td>
                    <td className="border p-1 text-xs">{vehicle.vehicle.brand} {vehicle.vehicle.model}</td>
                    <td className="border p-1 text-xs">{vehicle.vehicleGroup.id}</td>
                    <td className="border p-1 text-xs">{quote.globalParams?.monthlyKm || 3000}</td>
                    <td className="border p-1 text-xs">
                      {vehicleResult.protectionPlanId ? 'Sim' : 'Não'}
                    </td>
                    <td className="border p-1 text-xs">{formatCurrency(vehicleResult.totalCost)}</td>
                    <td className="border p-1 text-xs">{formatCurrency(vehicleResult.totalCost * (quote.globalParams?.contractMonths || 24))}</td>
                  </tr>
                );
              })}
              
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
                {quote.globalParams?.includeIpva || quote.globalParams?.includeLicensing ? 
                  'Impostos, taxas, licenciamento e IPVA' : 'Impostos e taxas'}
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-4">Validade da proposta: 10 dias.</p>
          <p className="mb-10">Atenciosamente,</p>
          <p className="font-bold">{quote.client?.responsible || 'Nome do Responsável'}</p>
          <p>Setor Comercial</p>
        </div>

        {/* Rodapé */}
        <div className="text-xs border-t pt-2 mt-10">
          <p className="font-bold">ASA RENT A CAR LOCAÇÃO DE VEÍCULOS LTDA - CNPJ: 07.005.206/0001-53</p>
          <div className="flex justify-between mt-1">
            <div>Recife, PE</div>
            <div className="text-right">contato@asalocadora.com.br</div>
          </div>
        </div>
      </div>
    );
  }
);

PropostaTemplate.displayName = 'PropostaTemplate';

export default PropostaTemplate;
