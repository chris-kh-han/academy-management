'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import {
  Building2,
  Store,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from 'lucide-react';

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
import { useBranch } from '@/contexts/BranchContext';

type UserType = 'owner' | 'staff' | null;
type Step = 'role' | 'brand' | 'branch' | 'invite' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { currentBrand, currentBranch, isInitialized, refreshContext } =
    useBranch();

  const [step, setStep] = useState<Step>('role');
  const [userType, setUserType] = useState<UserType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 지점이 있으면 대시보드로 리다이렉트 (브랜드만 있으면 지점 생성 필요)
  useEffect(() => {
    if (isInitialized && currentBranch) {
      router.push('/dashboard');
    }
    // 브랜드만 있고 지점이 없으면 지점 생성 단계로 바로 이동
    if (isInitialized && currentBrand && !currentBranch) {
      setUserType('owner');
      setStep('branch');
    }
  }, [isInitialized, currentBrand, currentBranch, router]);

  // Owner 폼 상태
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchSlug, setBranchSlug] = useState('');

  // Staff 폼 상태
  const [inviteCode, setInviteCode] = useState('');

  // slug 자동 생성 (영어, 숫자, 하이픈만)
  useEffect(() => {
    if (brandName) {
      setBrandSlug(
        brandName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      );
    }
  }, [brandName]);

  useEffect(() => {
    if (branchName) {
      setBranchSlug(
        branchName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      );
    }
  }, [branchName]);

  const handleRoleSelect = (type: UserType) => {
    setUserType(type);
    if (type === 'owner') {
      setStep('brand');
    } else {
      setStep('invite');
    }
  };

  const handleCreateBrand = async () => {
    if (!brandName.trim()) {
      toast.error('브랜드 이름을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/setup/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName, slug: brandSlug }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('브랜드가 생성되었습니다');
      await refreshContext(); // 컨텍스트 새로고침
      setStep('branch');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '브랜드 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchName.trim()) {
      toast.error('지점 이름을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/setup/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchName, slug: branchSlug }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('지점이 생성되었습니다');
      await refreshContext(); // 컨텍스트 새로고침
      setStep('complete');

      // 잠시 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '지점 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) {
      toast.error('초대 코드를 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('초대가 수락되었습니다');
      await refreshContext(); // 컨텍스트 새로고침
      setStep('complete');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : '초대 코드가 유효하지 않습니다',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중이거나 초기화 전이면 로딩 표시
  if (!isLoaded || !isInitialized) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // 이미 지점이 있으면 리다이렉트 중이므로 로딩 표시 (플래시 방지)
  if (currentBranch) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 진행 표시 */}
      <div className='flex justify-center'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <span className={step === 'role' ? 'text-primary font-medium' : ''}>
            역할 선택
          </span>
          <ArrowRight className='h-4 w-4' />
          <span
            className={
              ['brand', 'branch', 'invite'].includes(step)
                ? 'text-primary font-medium'
                : ''
            }
          >
            {userType === 'owner' ? '브랜드/지점 설정' : '초대 코드'}
          </span>
          <ArrowRight className='h-4 w-4' />
          <span
            className={step === 'complete' ? 'text-primary font-medium' : ''}
          >
            완료
          </span>
        </div>
      </div>

      {/* Step: 역할 선택 */}
      {step === 'role' && (
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>환영합니다!</CardTitle>
            <CardDescription>
              {user?.firstName || user?.fullName}님, 어떤 역할로 시작하시나요?
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <button
              onClick={() => handleRoleSelect('owner')}
              className='w-full p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group'
            >
              <div className='flex items-start gap-4'>
                <div className='p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
                  <Building2 className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='font-semibold text-lg'>
                    프랜차이즈 오너 / 본사 관리자
                  </h3>
                  <p className='text-muted-foreground text-sm mt-1'>
                    브랜드를 생성하고 여러 지점을 관리합니다
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('staff')}
              className='w-full p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group'
            >
              <div className='flex items-start gap-4'>
                <div className='p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
                  <Users className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='font-semibold text-lg'>매장 관리자 / 직원</h3>
                  <p className='text-muted-foreground text-sm mt-1'>
                    초대 코드를 받아 기존 지점에 합류합니다
                  </p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step: 브랜드 생성 */}
      {step === 'brand' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building2 className='h-5 w-5' />
              브랜드 정보
            </CardTitle>
            <CardDescription>
              본사/프랜차이즈 브랜드 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='brandName'>브랜드 이름</Label>
              <Input
                id='brandName'
                placeholder='예: 맛있는 피자'
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='brandSlug'>URL 식별자</Label>
              <Input
                id='brandSlug'
                placeholder='자동 생성됩니다'
                value={brandSlug}
                onChange={(e) => setBrandSlug(e.target.value)}
                disabled={isSubmitting}
              />
              <p className='text-xs text-muted-foreground'>
                URL에 사용되는 고유 식별자입니다
              </p>
            </div>

            <div className='flex gap-2 pt-4'>
              <Button
                variant='outline'
                onClick={() => setStep('role')}
                disabled={isSubmitting}
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                이전
              </Button>
              <Button
                className='flex-1'
                onClick={handleCreateBrand}
                disabled={isSubmitting || !brandName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    생성 중...
                  </>
                ) : (
                  <>
                    다음
                    <ArrowRight className='h-4 w-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: 지점 생성 */}
      {step === 'branch' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Store className='h-5 w-5' />첫 번째 지점
            </CardTitle>
            <CardDescription>첫 번째 지점 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='branchName'>지점 이름</Label>
              <Input
                id='branchName'
                placeholder='예: 강남점'
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='branchSlug'>URL 식별자</Label>
              <Input
                id='branchSlug'
                placeholder='자동 생성됩니다'
                value={branchSlug}
                onChange={(e) => setBranchSlug(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button
                variant='outline'
                onClick={() => setStep('brand')}
                disabled={isSubmitting}
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                이전
              </Button>
              <Button
                className='flex-1'
                onClick={handleCreateBranch}
                disabled={isSubmitting || !branchName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    생성 중...
                  </>
                ) : (
                  <>
                    완료
                    <Check className='h-4 w-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: 초대 코드 입력 */}
      {step === 'invite' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              초대 코드 입력
            </CardTitle>
            <CardDescription>
              관리자로부터 받은 6자리 초대 코드를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='inviteCode'>초대 코드</Label>
              <Input
                id='inviteCode'
                placeholder='ABC123'
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                maxLength={6}
                className='text-center text-2xl tracking-widest font-mono'
              />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button
                variant='outline'
                onClick={() => setStep('role')}
                disabled={isSubmitting}
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                이전
              </Button>
              <Button
                className='flex-1'
                onClick={handleAcceptInvite}
                disabled={isSubmitting || inviteCode.length !== 6}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    확인 중...
                  </>
                ) : (
                  <>
                    참여하기
                    <Check className='h-4 w-4 ml-2' />
                  </>
                )}
              </Button>
            </div>

            <p className='text-center text-sm text-muted-foreground pt-2'>
              초대 코드가 없으신가요? 관리자에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step: 완료 */}
      {step === 'complete' && (
        <Card>
          <CardContent className='py-12 text-center'>
            <div className='mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4'>
              <Check className='h-8 w-8 text-green-600' />
            </div>
            <h2 className='text-2xl font-bold mb-2'>설정 완료!</h2>
            <p className='text-muted-foreground'>
              잠시 후 대시보드로 이동합니다...
            </p>
            <Loader2 className='h-5 w-5 animate-spin mx-auto mt-4 text-muted-foreground' />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
