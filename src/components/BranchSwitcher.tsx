'use client';

import { useState } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function BranchSwitcher() {
  const {
    currentBranch,
    currentBrand,
    availableBranches,
    isLoading,
    isInitialized,
    switchBranch,
  } = useBranch();

  const [isSwitching, setIsSwitching] = useState(false);

  // 아직 초기화되지 않았거나 브랜드/지점이 없으면 표시하지 않음
  if (!isInitialized || isLoading) {
    return (
      <div className='flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span>로딩중...</span>
      </div>
    );
  }

  // 할당된 지점이 없으면
  if (!currentBranch && !currentBrand) {
    return (
      <div className='flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground'>
        <Building2 className='h-4 w-4' />
        <span>지점 미할당</span>
      </div>
    );
  }

  // 지점이 1개뿐이면 드롭다운 대신 단순 표시
  if (availableBranches.length <= 1) {
    return (
      <div className='flex items-center gap-2 px-3 py-2'>
        <Building2 className='h-4 w-4 text-primary' />
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>
            {currentBranch?.name || currentBrand?.name}
          </span>
          {currentBranch && currentBrand && (
            <span className='text-xs text-muted-foreground'>
              {currentBrand.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 여러 지점 접근 가능 → 드롭다운
  const handleSwitch = async (branchId: string) => {
    if (branchId === currentBranch?.id) return;

    setIsSwitching(true);
    await switchBranch(branchId);
    setIsSwitching(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex items-center gap-2 px-3 h-auto py-2'
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Building2 className='h-4 w-4 text-primary' />
          )}
          <div className='flex flex-col items-start'>
            <span className='text-sm font-medium'>
              {currentBranch?.name || currentBrand?.name}
            </span>
            {currentBranch && currentBrand && (
              <span className='text-xs text-muted-foreground'>
                {currentBrand.name}
              </span>
            )}
          </div>
          <ChevronDown className='h-4 w-4 ml-1 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-56'>
        <DropdownMenuLabel>지점 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleSwitch(branch.id)}
            className='flex items-center justify-between cursor-pointer'
          >
            <div className='flex flex-col'>
              <span>{branch.name}</span>
              {branch.brand && (
                <span className='text-xs text-muted-foreground'>
                  {branch.brand.name}
                </span>
              )}
            </div>
            {currentBranch?.id === branch.id && (
              <Check className='h-4 w-4 text-primary' />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
