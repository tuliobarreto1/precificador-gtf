
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users } from 'lucide-react';

interface SegmentStepProps {
  onSegmentSelect: (segment: 'GTF' | 'Assinatura') => void;
}

const SegmentStep: React.FC<SegmentStepProps> = ({ onSegmentSelect }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Selecione o Segmento</h2>
        <p className="text-muted-foreground">
          Escolha o tipo de proposta que deseja criar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onSegmentSelect('GTF')}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">GTF (Gestão Total de Frotas)</CardTitle>
            <CardDescription>
              Proposta tradicional para empresas com gestão completa de frotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Disponível para PF e PJ</li>
              <li>• Todos os níveis de severidade operacional</li>
              <li>• Parâmetros flexíveis de proteção</li>
              <li>• Processo completo de aprovação</li>
            </ul>
            <Button className="w-full mt-4" variant="outline">
              Selecionar GTF
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onSegmentSelect('Assinatura')}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Assinatura</CardTitle>
            <CardDescription>
              Proposta simplificada para pessoas físicas com condições especiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Exclusivo para Pessoa Física (CPF)</li>
              <li>• Severidade operacional baixa (nível 1)</li>
              <li>• Proteção otimizada para uso pessoal</li>
              <li>• ROIC mínimo de 2,7%</li>
            </ul>
            <Button className="w-full mt-4" variant="outline">
              Selecionar Assinatura
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SegmentStep;
