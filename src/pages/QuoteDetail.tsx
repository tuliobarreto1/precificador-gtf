
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Car, Users, MapPin, Wallet } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { getQuoteById, Quote } from '@/lib/mock-data';
import { SavedQuote } from '@/context/QuoteContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Type guard para diferenciar entre Quote (mock) e SavedQuote (localStorage)
function isSavedQuote(quote: SavedQuote | Quote): quote is SavedQuote {
  return 'vehicles' in quote;
}

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<SavedQuote | Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Primeiro, tentar carregar da localStorage (SavedQuote)
    try {
      const savedQuotes = localStorage.getItem('savedQuotes');
      if (savedQuotes) {
        const quotes: SavedQuote[] = JSON.parse(savedQuotes);
        const savedQuote = quotes.find(q => q.id === id);
        
        if (savedQuote) {
          setQuote(savedQuote);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cotação do localStorage:', error);
    }

    // Se não encontrar no localStorage, carregar dos mocks
    const mockQuote = getQuoteById(id);
    if (mockQuote) {
      setQuote(mockQuote);
    } else {
      console.error(`Cotação não encontrada: ${id}`);
    }
    
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="flex justify-center items-center h-96">
            <div className="animate-pulse text-lg">Carregando...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!quote) {
    return (
      <MainLayout>
        <div className="py-8">
          <Card>
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Cotação não encontrada</h2>
              <p className="mb-6">A cotação que você está procurando não existe ou foi removida.</p>
              <Button asChild>
                <Link to="/orcamentos">Ver todas as cotações</Link>
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Formatar data
  let formattedDate = '';
  try {
    if (isSavedQuote(quote)) {
      const date = new Date(quote.createdAt);
      formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else {
      const date = new Date(quote.date);
      formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    formattedDate = 'Data não disponível';
  }

  // Preço formatado
  const totalPrice = isSavedQuote(quote) 
    ? quote.totalCost 
    : quote.value;

  return (
    <MainLayout>
      <div className="py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4"
            onClick={() => navigate('/orcamentos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Orçamentos
          </Button>
          
          <PageTitle 
            title={`Orçamento #${quote.id}`} 
            subtitle={`Criado em ${formattedDate}`} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Dados do Cliente</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nome/Razão Social</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) ? quote.clientName : quote.clientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Documento</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) ? quote.clientDocument || 'Não informado' : 'Não disponível'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) && quote.clientEmail 
                        ? quote.clientEmail 
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) && quote.clientPhone 
                        ? quote.clientPhone 
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pessoa de Contato</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) && quote.clientContactPerson 
                        ? quote.clientContactPerson 
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Responsável pela Proposta</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) && quote.quoteResponsible
                        ? quote.quoteResponsible
                        : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Detalhes do Orçamento</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Prazo</h3>
                    </div>
                    <p className="text-lg font-semibold">
                      {isSavedQuote(quote) ? quote.contractMonths : quote.months} meses
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Quilometragem</h3>
                    </div>
                    <p className="text-lg font-semibold">
                      {isSavedQuote(quote) 
                        ? `${quote.monthlyKm.toLocaleString('pt-BR')} km/mês`
                        : `${quote.monthlyKm.toLocaleString('pt-BR')} km/mês`}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <Wallet className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Valor Mensal</h3>
                    </div>
                    <p className="text-lg font-semibold">
                      R$ {totalPrice.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-3">Veículos Incluídos</h3>
                
                {isSavedQuote(quote) ? (
                  <div className="space-y-3">
                    {quote.vehicles.map((vehicle, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{vehicle.vehicleBrand} {vehicle.vehicleModel}</h4>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.plateNumber ? `Placa: ${vehicle.plateNumber} • ` : ''}
                              Grupo: {vehicle.groupId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">R$ {vehicle.totalCost.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-muted-foreground">Valor mensal</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Depreciação:</p>
                            <p className="font-medium">R$ {vehicle.depreciationCost.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Manutenção:</p>
                            <p className="font-medium">R$ {vehicle.maintenanceCost.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Km excedente:</p>
                            <p className="font-medium">R$ {vehicle.extraKmRate.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{quote.vehicleBrand} {quote.vehicleModel}</h4>
                        <p className="text-sm text-muted-foreground">
                          Grupo: {quote.vehicleGroup}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {quote.value.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-muted-foreground">Valor mensal</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Depreciação:</p>
                        <p className="font-medium">R$ {quote.depreciationCost.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Manutenção:</p>
                        <p className="font-medium">R$ {quote.maintenanceCost.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Km excedente:</p>
                        <p className="font-medium">R$ {quote.extraKmRate.toFixed(2)}/km</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resumo</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <p className="text-muted-foreground">Veículos</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) ? quote.vehicles.length : 1}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <p className="text-muted-foreground">Prazo</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) ? quote.contractMonths : quote.months} meses
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <p className="text-muted-foreground">Quilometragem Total</p>
                    <p className="font-medium">
                      {isSavedQuote(quote) 
                        ? `${(quote.monthlyKm * quote.contractMonths).toLocaleString('pt-BR')} km`
                        : `${(quote.monthlyKm * quote.months).toLocaleString('pt-BR')} km`}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-muted-foreground text-sm mb-1">Valor Total Mensal</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {totalPrice.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Ações</h2>
                
                <div className="space-y-3">
                  <Button className="w-full">
                    Aprovar Orçamento
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Gerar PDF
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Enviar por E-mail
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteDetail;
