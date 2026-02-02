'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  RefreshCw,
  type LucideIcon,
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

type CardConfig = {
  title: string;
  key: keyof SummaryProps['summary'];
  icon: LucideIcon;
  color: string;
  bgColor: string;
  type: MovementType;
};

// rendering-hoist-jsx: 정적 설정을 컴포넌트 외부로 이동
const CARD_CONFIGS: CardConfig[] = [
  {
    title: '입고',
    key: 'incoming',
    icon: ArrowDownCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    type: 'in',
  },
  {
    title: '출고',
    key: 'outgoing',
    icon: ArrowUpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    type: 'out',
  },
  {
    title: '폐기',
    key: 'waste',
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    type: 'waste',
  },
  {
    title: '조정',
    key: 'adjustment',
    icon: RefreshCw,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    type: 'adjustment',
  },
];

export function MovementsSummary({ summary, onCardClick }: SummaryProps) {
  return (
    <>
      {/* 모바일: 컴팩트한 한 줄 바 */}
      <div className='flex gap-2 md:hidden'>
        {CARD_CONFIGS.map((config) => (
          <button
            key={config.title}
            type='button'
            onClick={() => onCardClick?.(config.type)}
            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg ${config.bgColor} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
          >
            <span className={`text-xs font-medium ${config.color}`}>
              {config.title}
            </span>
            <span className={`text-sm font-bold tabular-nums ${config.color}`}>
              {summary[config.key].toLocaleString('ko-KR')}
            </span>
          </button>
        ))}
      </div>

      {/* 데스크톱: 기존 카드 레이아웃 */}
      <div className='hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {CARD_CONFIGS.map((config) => {
          const Icon = config.icon;
          return (
            <Card
              key={config.title}
              className='transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
              onClick={() => onCardClick?.(config.type)}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {config.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${config.bgColor}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold tabular-nums'>
                  {summary[config.key].toLocaleString('ko-KR')}
                </div>
                <p className='text-xs text-muted-foreground'>건수</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
