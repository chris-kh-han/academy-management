'use client';

import { useState, useTransition, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  ClipboardList,
  History,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import type { DailyClosing } from '@/types';
import {
  createClosingAction,
  saveClosingItemAction,
  completeClosingAction,
  getClosingDataAction,
} from '../actions';
import ClosingForm from './ClosingForm';
import ClosingHistory from './ClosingHistory';
import { ClosingUploadDialog } from './ClosingUploadDialog';

type Ingredient = {
  id: string;
  ingredient_name: string;
  category: string;
  unit: string;
  current_qty: number;
  target_stock: number;
};

export default function ClosingContent() {
  const { currentBranch, isInitialized, user } = useBranch();
  const [activeTab, setActiveTab] = useState('today');
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [closingHistory, setClosingHistory] = useState<DailyClosing[]>([]);
  const [today, setToday] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    if (!currentBranch?.id) return;
    setIsLoading(true);
    try {
      const result = await getClosingDataAction(currentBranch.id);
      if (result.success && result.data) {
        setToday(result.data.today);
        setClosing(result.data.todayClosing);
        setIngredients(result.data.ingredients);
        setClosingHistory(result.data.closingHistory);
      }
    } catch (error) {
      console.error('Failed to load closing data:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (!isInitialized || !currentBranch?.id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranch?.id, isInitialized]);

  // 마감 기록 생성
  const handleCreateClosing = () => {
    if (!currentBranch?.id) return;

    startTransition(async () => {
      const result = await createClosingAction(currentBranch.id, today);
      if (result.success && result.data) {
        setClosing(result.data);
        toast.success('마감 기록이 생성되었습니다.');
      } else {
        toast.error(result.error || '마감 기록 생성 실패');
      }
    });
  };

  // 아이템 저장
  const handleSaveItem = async (item: {
    ingredient_id: string;
    opening_qty: number;
    used_qty: number;
    waste_qty?: number;
  }) => {
    if (!closing?.id) return;

    const result = await saveClosingItemAction(closing.id, item);
    if (!result.success) {
      toast.error(result.error || '저장 실패');
    }
  };

  // 마감 완료
  const handleComplete = async () => {
    if (!closing?.id || !user?.id) return;

    setIsCompleting(true);
    try {
      const result = await completeClosingAction(closing.id, user.id);
      if (result.success) {
        toast.success('마감이 완료되었습니다. 재고가 업데이트되었습니다.');
        setClosing((prev) => (prev ? { ...prev, status: 'completed' } : null));
      } else {
        toast.error(result.error || '마감 완료 실패');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // 입력된 아이템 수 계산
  const inputtedCount =
    closing?.items?.filter((item) => item.used_qty > 0).length || 0;
  const totalCount = ingredients.length;

  // 로딩 상태
  if (!isInitialized || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
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
          <h1 className="text-2xl font-bold">마감 체크</h1>
          <p className="text-muted-foreground">
            오늘의 재고 사용량을 입력하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-3 py-1">
            {today}
          </Badge>
          {closing?.status === 'completed' && (
            <Badge className="bg-green-500">완료됨</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            오늘 마감
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {!closing ? (
            // 마감 기록이 없을 때
            <Card>
              <CardHeader>
                <CardTitle>오늘 마감 시작</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  오늘({today})의 마감 기록을 시작하시겠습니까?
                </p>
                <Button onClick={handleCreateClosing} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ClipboardList className="w-4 h-4 mr-2" />
                  )}
                  마감 시작
                </Button>
              </CardContent>
            </Card>
          ) : closing.status === 'completed' ? (
            // 마감 완료됨
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  마감 완료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  오늘의 마감이 완료되었습니다.
                </p>
                {closing.closed_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    완료 시간:{' '}
                    {new Date(closing.closed_at).toLocaleString('ko-KR')}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            // 마감 진행 중
            <div className="space-y-4">
              {/* 진행 상태 */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        입력 현황:
                      </span>
                      <span className="font-medium">
                        {inputtedCount} / {totalCount} 품목
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsUploadDialogOpen(true)}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel 업로드
                      </Button>
                      <Button
                        onClick={handleComplete}
                        disabled={isCompleting || inputtedCount === 0}
                      >
                        {isCompleting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        마감 완료
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 마감 입력 폼 */}
              <ClosingForm
                closingId={closing.id}
                ingredients={ingredients}
                closingItems={closing.items || []}
                onSaveItem={handleSaveItem}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ClosingHistory history={closingHistory} />
        </TabsContent>
      </Tabs>

      {/* Excel 업로드 다이얼로그 */}
      {closing && (
        <ClosingUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          closingId={closing.id}
          ingredients={ingredients}
          onUploadComplete={loadData}
        />
      )}
    </div>
  );
}
