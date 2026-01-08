'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Building2, Store, Loader2 } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';

export default function BrandBranchSetupForm() {
  const { userRole, refreshContext } = useBranch();
  const [isCreating, setIsCreating] = useState(false);

  // 브랜드 생성 폼
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');

  // 지점 생성 폼
  const [branchName, setBranchName] = useState('');
  const [branchSlug, setBranchSlug] = useState('');

  // owner 또는 admin인지 확인
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !brandSlug) {
      toast.error('브랜드 이름과 slug를 입력해주세요');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/setup/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName, slug: brandSlug }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`브랜드 "${brandName}"이(가) 생성되었습니다!`);
      setBrandName('');
      setBrandSlug('');
      await refreshContext();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '브랜드 생성 실패');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchSlug) {
      toast.error('지점 이름과 slug를 입력해주세요');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/setup/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchName, slug: branchSlug }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`지점 "${branchName}"이(가) 생성되었습니다!`);
      setBranchName('');
      setBranchSlug('');
      await refreshContext();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '지점 생성 실패');
    } finally {
      setIsCreating(false);
    }
  };

  // slug 자동 생성
  useEffect(() => {
    if (brandName) {
      setBrandSlug(
        brandName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      );
    }
  }, [brandName]);

  useEffect(() => {
    if (branchName) {
      setBranchSlug(
        branchName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      );
    }
  }, [branchName]);

  if (!isOwnerOrAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>브랜드/지점 관리</CardTitle>
          <CardDescription>
            이 기능은 Owner 또는 Admin 권한이 필요합니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 브랜드 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            브랜드 생성
          </CardTitle>
          <CardDescription>
            본사/프랜차이즈 브랜드를 생성합니다. 현재 로그인한 사용자가 Owner가
            됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBrand} className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='brandName'>브랜드 이름</Label>
                <Input
                  id='brandName'
                  placeholder='예: 피자하우스'
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='brandSlug'>Slug (URL용)</Label>
                <Input
                  id='brandSlug'
                  placeholder='예: pizza-house'
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                />
              </div>
            </div>
            <Button type='submit' disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  생성 중...
                </>
              ) : (
                '브랜드 생성'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 지점 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Store className='h-5 w-5' />
            지점 생성
          </CardTitle>
          <CardDescription>
            브랜드 하위에 지점을 생성합니다. 먼저 브랜드를 생성해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBranch} className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='branchName'>지점 이름</Label>
                <Input
                  id='branchName'
                  placeholder='예: 강남점'
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='branchSlug'>Slug (URL용)</Label>
                <Input
                  id='branchSlug'
                  placeholder='예: gangnam'
                  value={branchSlug}
                  onChange={(e) => setBranchSlug(e.target.value)}
                />
              </div>
            </div>
            <Button type='submit' disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  생성 중...
                </>
              ) : (
                '지점 생성'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
