'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StockMovementsReportProps = {
  stockMovements: any[];
  movementsSummary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  incoming: '입고',
  in: '입고',
  outgoing: '출고',
  out: '출고',
  waste: '폐기',
  adjustment: '조정',
};

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  incoming: '#00C49F',
  in: '#00C49F',
  outgoing: '#8884D8',
  out: '#8884D8',
  waste: '#FF8042',
  adjustment: '#FFBB28',
};

export default function StockMovementsReport({
  stockMovements,
  movementsSummary,
}: StockMovementsReportProps) {
  // 요약 차트 데이터
  const summaryChartData = [
    { name: '입고', value: movementsSummary.incoming, color: '#00C49F' },
    { name: '출고', value: movementsSummary.outgoing, color: '#8884D8' },
    { name: '폐기', value: movementsSummary.waste, color: '#FF8042' },
    { name: '조정', value: movementsSummary.adjustment, color: '#FFBB28' },
  ].filter((item) => item.value > 0);

  // 재료별 이동량 집계
  const ingredientMovements = new Map<
    string,
    { name: string; incoming: number; outgoing: number; waste: number }
  >();

  stockMovements.forEach((m) => {
    const name = Array.isArray(m.ingredients)
      ? m.ingredients[0]?.ingredient_name
      : m.ingredients?.ingredient_name || 'Unknown';

    const existing = ingredientMovements.get(name) || {
      name,
      incoming: 0,
      outgoing: 0,
      waste: 0,
    };

    if (m.movement_type === 'incoming' || m.movement_type === 'in') {
      existing.incoming += m.quantity || 0;
    } else if (m.movement_type === 'outgoing' || m.movement_type === 'out') {
      existing.outgoing += m.quantity || 0;
    } else if (m.movement_type === 'waste') {
      existing.waste += m.quantity || 0;
    }

    ingredientMovements.set(name, existing);
  });

  // 상위 10개 재료 이동량
  const topIngredientMovements = Array.from(ingredientMovements.values())
    .sort((a, b) => b.incoming + b.outgoing - (a.incoming + a.outgoing))
    .slice(0, 10);

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-6'>
      {/* 요약 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='border-green-200 bg-green-50'>
          <CardHeader className='pb-2'>
            <CardDescription>총 입고량</CardDescription>
            <CardTitle className='text-2xl text-green-600'>
              {movementsSummary.incoming.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className='border-blue-200 bg-blue-50'>
          <CardHeader className='pb-2'>
            <CardDescription>총 출고량</CardDescription>
            <CardTitle className='text-2xl text-blue-600'>
              {movementsSummary.outgoing.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={
            movementsSummary.waste > 0 ? 'border-red-200 bg-red-50' : ''
          }
        >
          <CardHeader className='pb-2'>
            <CardDescription>폐기량</CardDescription>
            <CardTitle
              className={`text-2xl ${movementsSummary.waste > 0 ? 'text-red-600' : ''}`}
            >
              {movementsSummary.waste.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>총 이동 건수</CardDescription>
            <CardTitle className='text-2xl'>
              {stockMovements.length.toLocaleString()}건
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 이동 유형별 비율 */}
        <Card>
          <CardHeader>
            <CardTitle>이동 유형별 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              {summaryChartData.length > 0 ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={summaryChartData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: ${value.toLocaleString()}`
                      }
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {summaryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex items-center justify-center h-full text-gray-500'>
                  이동 내역이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 재료별 이동량 Top 10 */}
        <Card>
          <CardHeader>
            <CardTitle>재료별 이동량 Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              {topIngredientMovements.length > 0 ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={topIngredientMovements} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis
                      dataKey='name'
                      type='category'
                      width={80}
                      tickFormatter={(value) =>
                        value.length > 6 ? value.slice(0, 6) + '...' : value
                      }
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='incoming' name='입고' fill='#00C49F' />
                    <Bar dataKey='outgoing' name='출고' fill='#8884D8' />
                    <Bar dataKey='waste' name='폐기' fill='#FF8042' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex items-center justify-center h-full text-gray-500'>
                  이동 내역이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 이동 내역 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>재고 이동 내역</CardTitle>
          <CardDescription>최근 순으로 정렬</CardDescription>
        </CardHeader>
        <CardContent>
          {stockMovements.length > 0 ? (
            <div className='max-h-[500px] overflow-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>일시</TableHead>
                    <TableHead>재료명</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead className='text-right'>수량</TableHead>
                    <TableHead>단위</TableHead>
                    <TableHead>비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((item, index) => {
                    const ingredientName = Array.isArray(item.ingredients)
                      ? item.ingredients[0]?.ingredient_name
                      : item.ingredients?.ingredient_name || 'Unknown';

                    return (
                      <TableRow key={item.id || index}>
                        <TableCell className='whitespace-nowrap'>
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {ingredientName}
                        </TableCell>
                        <TableCell>
                          <span
                            className='px-2 py-1 rounded text-sm font-medium'
                            style={{
                              backgroundColor:
                                MOVEMENT_TYPE_COLORS[item.movement_type] + '20',
                              color: MOVEMENT_TYPE_COLORS[item.movement_type],
                            }}
                          >
                            {MOVEMENT_TYPE_LABELS[item.movement_type] ||
                              item.movement_type}
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.quantity?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell className='max-w-[200px] truncate'>
                          {item.note || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='text-center py-10 text-gray-500'>
              조회 기간 내 재고 이동 내역이 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
