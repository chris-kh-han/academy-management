'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, Trash2, RefreshCw } from 'lucide-react';

type SummaryProps = {
  summary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
};

export function MovementsSummary({ summary }: SummaryProps) {
  const cards = [
    {
      title: '입고',
      value: summary.incoming,
      icon: ArrowDownCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '출고',
      value: summary.outgoing,
      icon: ArrowUpCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '폐기',
      value: summary.waste,
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '조정',
      value: summary.adjustment,
      icon: RefreshCw,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {card.value.toLocaleString('ko-KR')}
            </div>
            <p className='text-xs text-muted-foreground'>총 수량</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
