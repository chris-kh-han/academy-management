'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrdersTable } from './OrdersTable';
import { CreateOrderDialog } from './CreateOrderDialog';
import { RecommendationsTable } from './RecommendationsTable';
import type { PurchaseOrder } from '@/types';

type OrdersContentProps = {
  orders: PurchaseOrder[];
  ingredients: {
    id: string;
    name: string;
    unit: string;
    price: number;
    current_qty: number;
    reorder_point: number | null;
  }[];
  recommendations: {
    ingredient_id: string;
    ingredient_name: string;
    unit: string;
    current_qty: number;
    reorder_point: number;
    recommended_qty: number;
    supplier?: string;
  }[];
};

export function OrdersContent({
  orders,
  ingredients,
  recommendations,
}: OrdersContentProps) {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = React.useState<
    string[]
  >([]);

  // 추천 품목으로 발주서 생성
  const handleCreateFromRecommendations = () => {
    setSelectedRecommendations(recommendations.map((r) => r.ingredient_id));
    setCreateDialogOpen(true);
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>발주 관리</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            발주서를 생성하고 관리합니다.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            className='cursor-pointer'
            onClick={() => {
              setSelectedRecommendations([]);
              setCreateDialogOpen(true);
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            발주서 작성
          </Button>
        </div>
      </div>

      <Tabs defaultValue='orders' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='orders'>발주 내역</TabsTrigger>
          <TabsTrigger value='recommendations'>
            발주 추천
            {recommendations.length > 0 && (
              <span className='ml-2 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full'>
                {recommendations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='orders'>
          <OrdersTable orders={orders} />
        </TabsContent>

        <TabsContent value='recommendations'>
          <RecommendationsTable
            recommendations={recommendations}
            onCreateOrder={handleCreateFromRecommendations}
          />
        </TabsContent>
      </Tabs>

      <CreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        ingredients={ingredients}
        initialIngredients={selectedRecommendations}
        recommendations={recommendations}
      />
    </div>
  );
}
