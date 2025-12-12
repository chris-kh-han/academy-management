import {
  getStockMovementsPaginated,
  getStockMovementsSummary,
  getAllIngredients,
} from '@/utils/supabase/supabase';
import { MovementsTable } from './components/MovementsTable';
import { MovementsSummary } from './components/MovementsSummary';
import { MovementFormDialog } from './components/MovementFormDialog';

export const dynamic = 'force-dynamic';

const Movements = async () => {
  const [{ data: movements }, summary, ingredients] = await Promise.all([
    getStockMovementsPaginated({ limit: 50 }),
    getStockMovementsSummary(),
    getAllIngredients(),
  ]);

  // 재료 목록을 폼에서 사용할 형식으로 변환
  const ingredientOptions = (ingredients ?? []).map((item) => ({
    id: item.id,
    name: item.ingredient_name ?? '',
    unit: item.unit ?? '',
  }));

  return (
    <div className='p-4 md:p-6'>
      <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>입출고 관리</h1>
          <p className='text-muted-foreground'>
            재료의 입고, 출고, 폐기 내역을 관리합니다.
          </p>
        </div>
        <MovementFormDialog ingredients={ingredientOptions} />
      </div>

      <MovementsSummary summary={summary} />

      <div className='mt-6'>
        <h2 className='text-lg font-semibold mb-4'>이동 내역</h2>
        <MovementsTable data={movements} />
      </div>
    </div>
  );
};

export default Movements;
