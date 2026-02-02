'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesReport from './SalesReport';
import InventoryReport from './InventoryReport';
import StockMovementsReport from './StockMovementsReport';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportsContentProps = {
  salesByMenu: any[];
  inventory: any[];
  lowStock: any[];
  menuAnalysis: any[];
  topMenus: any[];
  stockMovements: any[];
  movementsSummary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

export default function ReportsContent({
  salesByMenu,
  inventory,
  lowStock,
  topMenus,
  stockMovements,
  movementsSummary,
  dateRange,
}: ReportsContentProps) {
  return (
    <div className='p-6 w-full'>
      <h1 className='text-2xl font-bold mb-6'>리포트</h1>
      <p className='text-gray-500 mb-6'>
        조회 기간: {dateRange.startDate} ~ {dateRange.endDate}
      </p>

      <Tabs defaultValue='inventory' className='w-full'>
        <TabsList className='grid w-full grid-cols-3 mb-6'>
          <TabsTrigger value='inventory'>재고 현황</TabsTrigger>
          <TabsTrigger value='movements'>입출고 분석</TabsTrigger>
          <TabsTrigger value='sales'>매출 리포트</TabsTrigger>
        </TabsList>

        <TabsContent value='inventory'>
          <InventoryReport inventory={inventory} lowStock={lowStock} />
        </TabsContent>

        <TabsContent value='movements'>
          <StockMovementsReport
            stockMovements={stockMovements}
            movementsSummary={movementsSummary}
          />
        </TabsContent>

        <TabsContent value='sales'>
          <SalesReport salesByMenu={salesByMenu} topMenus={topMenus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
