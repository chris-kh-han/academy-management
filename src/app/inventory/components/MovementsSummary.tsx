'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { MovementType } from '@/types';

type SummaryProps = {
  summary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
  onCardClick?: (type: MovementType) => void;
};

export function MovementsSummary({ summary, onCardClick }: SummaryProps) {
  const cards: {
    title: string;
    value: number;
    icon: typeof ArrowDownCircle;
    color: string;
    bgColor: string;
    type: MovementType;
  }[] = [
    {
      title: '입고',
      value: summary.incoming,
      icon: ArrowDownCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      type: 'in',
    },
    {
      title: '출고',
      value: summary.outgoing,
      icon: ArrowUpCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      type: 'out',
    },
    {
      title: '폐기',
      value: summary.waste,
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      type: 'waste',
    },
    {
      title: '조정',
      value: summary.adjustment,
      icon: RefreshCw,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      type: 'adjustment',
    },
  ];

  return (
    <>
      {/* 모바일: 컴팩트한 한 줄 바 */}
      <div className='flex gap-2 md:hidden'>
        {cards.map((card) => (
          <div
            key={card.title}
            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg ${card.bgColor}`}
          >
            <span className={`text-xs font-medium ${card.color}`}>
              {card.title}
            </span>
            <span className={`text-sm font-bold ${card.color}`}>
              {card.value.toLocaleString('ko-KR')}
            </span>
          </div>
        ))}
      </div>

      {/* 데스크톱: 기존 카드 레이아웃 */}
      <div className='hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {cards.map((card) => (
          <Card
            key={card.title}
            className='transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
            onClick={() => onCardClick?.(card.type)}
          >
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {card.value.toLocaleString('ko-KR')}
              </div>
              <p className='text-xs text-muted-foreground'>건수</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
