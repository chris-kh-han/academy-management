'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Copy, Check, Building2, Store, Loader2 } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';

export default function SetupPage() {
  const { user, isInitialized } = useBranch();
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 브랜드 생성 폼
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');

  // 지점 생성 폼
  const [branchName, setBranchName] = useState('');
  const [branchSlug, setBranchSlug] = useState('');

  const copyUserId = async () => {
    if (user?.id) {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success('User ID가 클립보드에 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      // 페이지 새로고침하여 상태 업데이트
      window.location.reload();
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
      window.location.reload();
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

  if (!isInitialized) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='container max-w-4xl py-8 space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>초기 설정</h1>
        <p className='text-muted-foreground mt-2'>
          브랜드와 지점을 설정하여 시작하세요
        </p>
      </div>

      {/* 현재 사용자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 로그인 정보</CardTitle>
          <CardDescription>
            이 정보를 사용하여 DB에서 사용자를 식별합니다
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <Label className='text-muted-foreground text-sm'>이름</Label>
              <p className='font-medium'>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || '-'}
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm'>이메일</Label>
              <p className='font-medium'>{user?.email || '-'}</p>
            </div>
          </div>

          <div>
            <Label className='text-muted-foreground text-sm'>Supabase User ID</Label>
            <div className='flex items-center gap-2 mt-1'>
              <code className='flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono'>
                {user?.id || '-'}
              </code>
              <Button
                variant='outline'
                size='icon'
                onClick={copyUserId}
                disabled={!user?.id}
              >
                {copied ? (
                  <Check className='h-4 w-4 text-green-500' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              이 ID가 brands.owner_user_id, branch_members.user_id 등에 저장됩니다
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 브랜드 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            브랜드 생성
          </CardTitle>
          <CardDescription>
            본사/프랜차이즈 브랜드를 생성합니다. 현재 로그인한 사용자가 Owner가 됩니다.
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

      {/* SQL 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>수동 SQL 삽입 가이드</CardTitle>
          <CardDescription>
            Supabase 대시보드에서 직접 SQL을 실행할 수도 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className='bg-muted p-4 rounded-md text-sm overflow-x-auto'>
{`-- 1. 브랜드 생성 (현재 사용자가 owner)
INSERT INTO brands (name, slug, owner_user_id)
VALUES ('피자하우스', 'pizza-house', '${user?.id || 'YOUR_SUPABASE_USER_ID'}');

-- 2. 지점 생성 (brand_id는 위에서 생성된 ID로 대체)
INSERT INTO branches (brand_id, name, slug)
VALUES ('BRAND_UUID', '강남점', 'gangnam');

-- 3. 다른 직원 추가 (branch_id, user_id 대체 필요)
INSERT INTO branch_members (branch_id, user_id, user_email, role, is_default)
VALUES ('BRANCH_UUID', 'SUPABASE_USER_ID', 'staff@example.com', 'staff', true);`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
