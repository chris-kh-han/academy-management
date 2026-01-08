'use client';

import { useBranch } from '@/contexts/BranchContext';
import { Building2, Loader2 } from 'lucide-react';

/**
 * B2C 모드: 브랜드 이름만 표시 (지점 선택 UI 숨김)
 * B2B 확장 시 지점 선택 드롭다운 복원 가능
 */
export default function BranchSwitcher() {
  const { currentBrand, isLoading, isInitialized } = useBranch();

  // 초기화 중
  if (!isInitialized || isLoading) {
    return (
      <div className='flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span>로딩중...</span>
      </div>
    );
  }

  // 브랜드가 없으면 표시하지 않음
  if (!currentBrand) {
    return null;
  }

  // 브랜드 이름만 표시
  return (
    <div className='flex items-center gap-2 px-3 py-2'>
      <Building2 className='h-4 w-4 text-primary' />
      <span className='text-sm font-medium'>{currentBrand.name}</span>
    </div>
  );
}
