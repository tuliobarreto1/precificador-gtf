
import React from 'react';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import StatusUpdater from '@/components/status/StatusUpdater';
import StatusHistory from '@/components/status/StatusHistory';
import { QuoteStatusFlow } from '@/lib/status-flow';

interface StatusCardProps {
  quoteId: string;
  currentStatus: QuoteStatusFlow;
}

const StatusCard: React.FC<StatusCardProps> = ({ quoteId, currentStatus }) => {
  return (
    <Card>
      <CardHeader title="Status e Ações" />
      <div className="p-4">
        <StatusUpdater quoteId={quoteId} currentStatus={currentStatus} />
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Histórico de Status</h4>
          <StatusHistory quoteId={quoteId} />
        </div>
      </div>
    </Card>
  );
};

export default StatusCard;
