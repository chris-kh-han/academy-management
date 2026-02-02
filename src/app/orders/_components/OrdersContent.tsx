'use client';

import { useState, useTransition, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import {
  Calculator,
  ClipboardList,
  Download,
  History,
  Loader2,
  Package,
  TrendingUp,
} from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import type { OrderRecommendation, CalculationMethod } from '@/types';
import {
  generateRecommendationsAction,
  markAsOrderedAction,
  getOrdersDataAction,
} from '../actions';
import RecommendationList from './RecommendationList';
import RecommendationHistory from './RecommendationHistory';

type Ingredient = {
  id: string;
  ingredient_name: string;
  category: string;
  unit: string;
  current_qty: number;
  target_stock: number;
};

export default function OrdersContent() {
  const { currentBranch, isInitialized } = useBranch();
  const [activeTab, setActiveTab] = useState('recommend');
  const [method, setMethod] = useState<CalculationMethod>('target');
  const [orderPeriodDays, setOrderPeriodDays] = useState(7);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recommendations, setRecommendations] = useState<OrderRecommendation[]>(
    [],
  );
  const [currentRecommendation, setCurrentRecommendation] =
    useState<OrderRecommendation | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (!isInitialized || !currentBranch?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await getOrdersDataAction(currentBranch.id);
        if (result.success && result.data) {
          setIngredients(result.data.ingredients);
          setRecommendations(result.data.recommendations);
          setCurrentRecommendation(
            result.data.recommendations.find((r) => r.status === 'pending') ||
              null,
          );
        }
      } catch (error) {
        console.error('Failed to load orders data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentBranch?.id, isInitialized]);

  // 추천 생성
  const handleGenerate = () => {
    if (!currentBranch?.id) return;

    startTransition(async () => {
      const result = await generateRecommendationsAction(
        currentBranch.id,
        method,
        {
          orderPeriodDays,
          avgDays: 14,
        },
      );

      if (result.success && result.data) {
        setCurrentRecommendation(result.data);
        toast.success('발주 추천이 생성되었습니다.');
      } else {
        toast.error(result.error || '발주 추천 생성 실패');
      }
    });
  };

  // 발주 완료 처리
  const handleMarkAsOrdered = async () => {
    if (!currentRecommendation) return;

    startTransition(async () => {
      const result = await markAsOrderedAction(currentRecommendation.id);

      if (result.success) {
        toast.success('발주 완료 처리되었습니다.');
        setCurrentRecommendation(null);
      } else {
        toast.error(result.error || '발주 완료 처리 실패');
      }
    });
  };

  // 엑셀 내보내기
  const handleExport = () => {
    if (!currentRecommendation?.items?.length) {
      toast.error('내보낼 데이터가 없습니다.');
      return;
    }

    // CSV 형식으로 내보내기
    const headers = ['품목명', '카테고리', '현재재고', '추천발주량', '단위'];
    const rows = currentRecommendation.items.map((item) => [
      item.ingredient_name || '',
      item.category || '',
      item.current_qty,
      item.recommended_qty,
      item.unit || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `발주추천_${currentRecommendation.recommendation_date}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('CSV 파일이 다운로드되었습니다.');
  };

  // 발주 필요 품목 수
  const lowStockCount = ingredients.filter(
    (ing) => ing.current_qty < (ing.target_stock || 0),
  ).length;

  // 로딩 상태
  if (!isInitialized || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentBranch?.id) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        지점 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">발주 관리</h1>
          <p className="text-muted-foreground">
            재고를 분석하고 발주를 추천받으세요
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 품목</p>
                <p className="text-2xl font-bold">{ingredients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">발주 필요</p>
                <p className="text-2xl font-bold text-red-600">
                  {lowStockCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">추천 품목</p>
                <p className="text-2xl font-bold">
                  {currentRecommendation?.items?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recommend" className="gap-2">
            <Calculator className="w-4 h-4" />
            발주 추천
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommend" className="mt-6 space-y-6">
          {/* 추천 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>추천 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label>계산 방식</Label>
                  <Select
                    value={method}
                    onValueChange={(v) => setMethod(v as CalculationMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target">
                        목표 재고 기준 (목표 - 현재)
                      </SelectItem>
                      <SelectItem value="average">
                        일평균 사용량 기준 (평균 × 기간)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-40 space-y-2">
                  <Label>발주 주기 (일)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={orderPeriodDays}
                    onChange={(e) =>
                      setOrderPeriodDays(parseInt(e.target.value) || 7)
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleGenerate} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4 mr-2" />
                    )}
                    추천 계산
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 추천 결과 */}
          {currentRecommendation ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>발주 추천 결과</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentRecommendation.recommendation_date} |{' '}
                    {currentRecommendation.calculation_method === 'target'
                      ? '목표 재고 기준'
                      : '일평균 사용량 기준'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                  <Button onClick={handleMarkAsOrdered} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    발주 완료
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RecommendationList items={currentRecommendation.items || []} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>위에서 설정을 선택하고 &ldquo;추천 계산&rdquo;을 눌러주세요.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <RecommendationHistory history={recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
