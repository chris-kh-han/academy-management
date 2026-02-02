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

type MenuAnalysisReportProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menuAnalysis: any[];
  topMenus: {
    menu_id: number;
    menu_name: string;
    category: string;
    total_sales: number;
    sales_count: number;
  }[];
};

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
];

export default function MenuAnalysisReport({
  menuAnalysis,
  topMenus,
}: MenuAnalysisReportProps) {
  // 원가율 구간별 분류
  const costRatioGroups = {
    low: menuAnalysis.filter((m) => m.cost_ratio < 30).length,
    medium: menuAnalysis.filter((m) => m.cost_ratio >= 30 && m.cost_ratio < 50)
      .length,
    high: menuAnalysis.filter((m) => m.cost_ratio >= 50).length,
  };

  const costRatioData = [
    { name: '양호 (<30%)', value: costRatioGroups.low, color: '#00C49F' },
    { name: '보통 (30-50%)', value: costRatioGroups.medium, color: '#FFBB28' },
    { name: '높음 (>50%)', value: costRatioGroups.high, color: '#FF8042' },
  ];

  // 수익성 높은 메뉴 (원가율 낮은 순)
  const profitableMenus = [...menuAnalysis]
    .filter((m) => m.price > 0)
    .sort((a, b) => a.cost_ratio - b.cost_ratio)
    .slice(0, 10);

  // 수익성 낮은 메뉴 (원가율 높은 순)
  const unprofitableMenus = [...menuAnalysis]
    .filter((m) => m.price > 0 && m.cost_ratio > 0)
    .sort((a, b) => b.cost_ratio - a.cost_ratio)
    .slice(0, 10);

  // 인기 메뉴 차트 데이터
  const popularChartData = topMenus.slice(0, 10).map((item) => ({
    name:
      item.menu_name.length > 8
        ? item.menu_name.slice(0, 8) + '...'
        : item.menu_name,
    판매량: item.sales_count,
  }));

  // 평균 원가율 계산
  const validMenus = menuAnalysis.filter((m) => m.price > 0 && m.cost_ratio > 0);
  const avgCostRatio =
    validMenus.length > 0
      ? validMenus.reduce((sum, m) => sum + m.cost_ratio, 0) / validMenus.length
      : 0;

  return (
    <div className='space-y-6'>
      {/* 요약 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>전체 메뉴 수</CardDescription>
            <CardTitle className='text-2xl'>{menuAnalysis.length}개</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>평균 원가율</CardDescription>
            <CardTitle
              className={`text-2xl ${avgCostRatio > 50 ? 'text-red-600' : avgCostRatio > 30 ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {avgCostRatio.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className='border-green-300 bg-green-50'>
          <CardHeader className='pb-2'>
            <CardDescription>수익성 좋은 메뉴</CardDescription>
            <CardTitle className='text-2xl text-green-600'>
              {costRatioGroups.low}개
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={costRatioGroups.high > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className='pb-2'>
            <CardDescription>원가율 높은 메뉴</CardDescription>
            <CardTitle
              className={`text-2xl ${costRatioGroups.high > 0 ? 'text-red-600' : ''}`}
            >
              {costRatioGroups.high}개
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 인기 메뉴 Top 10 */}
        <Card>
          <CardHeader>
            <CardTitle>인기 메뉴 Top 10</CardTitle>
            <CardDescription>판매량 기준</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={popularChartData} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis type='number' />
                  <YAxis dataKey='name' type='category' width={80} />
                  <Tooltip />
                  <Bar dataKey='판매량' fill='#8884d8' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 원가율 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>원가율 분포</CardTitle>
            <CardDescription>메뉴별 원가율 구간</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={costRatioData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}개`}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {costRatioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수익성 분석 테이블 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 수익성 높은 메뉴 */}
        <Card className='border-green-200'>
          <CardHeader>
            <CardTitle className='text-green-700'>수익성 높은 메뉴 Top 10</CardTitle>
            <CardDescription>원가율이 낮아 마진이 좋은 메뉴</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메뉴명</TableHead>
                  <TableHead className='text-right'>판매가</TableHead>
                  <TableHead className='text-right'>원가</TableHead>
                  <TableHead className='text-right'>원가율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitableMenus.map((item) => (
                  <TableRow key={item.menu_id}>
                    <TableCell className='font-medium'>
                      {item.menu_name}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.price?.toLocaleString()}원
                    </TableCell>
                    <TableCell className='text-right'>
                      {Math.round(item.estimated_cost)?.toLocaleString()}원
                    </TableCell>
                    <TableCell className='text-right text-green-600 font-medium'>
                      {item.cost_ratio?.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 수익성 낮은 메뉴 */}
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='text-red-700'>원가율 높은 메뉴 Top 10</CardTitle>
            <CardDescription>원가 절감이 필요한 메뉴</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메뉴명</TableHead>
                  <TableHead className='text-right'>판매가</TableHead>
                  <TableHead className='text-right'>원가</TableHead>
                  <TableHead className='text-right'>원가율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unprofitableMenus.map((item) => (
                  <TableRow key={item.menu_id}>
                    <TableCell className='font-medium'>
                      {item.menu_name}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.price?.toLocaleString()}원
                    </TableCell>
                    <TableCell className='text-right'>
                      {Math.round(item.estimated_cost)?.toLocaleString()}원
                    </TableCell>
                    <TableCell className='text-right text-red-600 font-medium'>
                      {item.cost_ratio?.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 전체 메뉴 분석 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 메뉴 원가 분석</CardTitle>
          <CardDescription>메뉴명 기준 정렬</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='max-h-[500px] overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메뉴명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className='text-right'>판매가</TableHead>
                  <TableHead className='text-right'>추정 원가</TableHead>
                  <TableHead className='text-right'>원가율</TableHead>
                  <TableHead className='text-right'>마진</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuAnalysis.map((item) => (
                  <TableRow
                    key={item.menu_id}
                    className={
                      item.cost_ratio > 50
                        ? 'bg-red-50'
                        : item.cost_ratio < 30
                          ? 'bg-green-50'
                          : ''
                    }
                  >
                    <TableCell className='font-medium'>
                      {item.menu_name}
                    </TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell className='text-right'>
                      {item.price?.toLocaleString() || 0}원
                    </TableCell>
                    <TableCell className='text-right'>
                      {Math.round(item.estimated_cost)?.toLocaleString() || 0}원
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        item.cost_ratio > 50
                          ? 'text-red-600'
                          : item.cost_ratio < 30
                            ? 'text-green-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {item.cost_ratio?.toFixed(1) || 0}%
                    </TableCell>
                    <TableCell className='text-right'>
                      {(item.price - item.estimated_cost)?.toLocaleString() || 0}
                      원
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
