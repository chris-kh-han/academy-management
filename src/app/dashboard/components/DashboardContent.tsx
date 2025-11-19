'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardCard from './DashboardCard';
import SaleChart from '@/components/Saleschart';
import Calendar from '@/components/Calendar';
import GlassCard from '@/components/GlassCard';
import { AccordionDemo } from '@/components/Accordion';

type Sale = {
  menu_name: string;
  total_sales: number;
  sales_count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type Ingredient = {
  ingredient_name: string;
  total_usage: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type DashboardContentProps = {
  sales: Sale[];
  daySales: Sale[];
  weekSales: Sale[];
  monthSales: Sale[];

  topIngredients: Ingredient[];
};

export default function DashboardContent({
  daySales,
  weekSales,
  monthSales,
}: DashboardContentProps) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in'); // force auth routes client-side after sign-out
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div className='p-4'>Loading...</div>;
  }

  if (!isSignedIn) return <div className='p-4'>Redirecting...</div>;

  console.log(weekSales);

  return (
    <div className='p-4 flex gap-4 flex-col w-full'>
      {/* 매출 순위 */}
      <div className='flex w-full gap-4'>
        <div className='w-2/3 gap-8 flex flex-col'>
          <DashboardCard sales={daySales} title='어제' />
          <DashboardCard sales={weekSales} title='이번 주' />
          <DashboardCard sales={monthSales} title='이번 달' />
        </div>
        <div className='w-1/3 gap-8 flex flex-col'>
          <Calendar />
          <div className='mt-28'>
            <GlassCard>
              <div>알림</div>
            </GlassCard>
            <GlassCard>
              <div>재고</div>{' '}
            </GlassCard>

            <AccordionDemo />
          </div>
        </div>
      </div>

      <div className='mt-8 w-full '>
        <SaleChart />
      </div>

      {/* 가장 많이 사용된 재료 */}
      {/* <div className='w-full lg:w-1/2'>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-bold mb-4'>가장 많이 사용된 재료</h2>
          <div className='space-y-3'>
            {topIngredients.map((item, index) => (
              <div
                key={item.ingredient_name}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition'
              >
                <div className='flex items-center gap-4'>
                  <span className='text-2xl font-bold text-gray-300'>
                    {index + 1}
                  </span>
                  <span className='font-medium'>{item.ingredient_name}</span>
                </div>
                <span className='text-lg font-semibold text-blue-600'>
                  {item.total_usage.toLocaleString()}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
}
