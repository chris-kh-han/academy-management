'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Brand, Branch, BrandRole, BranchRole } from '@/types';
import type { User } from '@supabase/supabase-js';

// 온보딩 리다이렉트에서 제외할 경로
const EXCLUDED_PATHS = ['/onboarding', '/sign-in', '/sign-up', '/setup', '/'];

/**
 * B2C 모드: 브랜드 중심 Context
 * - currentBranch는 내부 데이터 저장용으로 유지 (UI에서 숨김)
 * - switchBranch, availableBranches는 B2B 확장 시 복원
 */
type BranchContextType = {
  // 현재 상태
  currentBrand: Brand | null;
  currentBranch: Branch | null; // 내부용 (데이터 저장 시 필요)
  userRole: BrandRole | BranchRole | null;
  user: User | null;

  // 로딩 상태
  isLoading: boolean;
  isInitialized: boolean;

  // 액션
  refreshContext: () => Promise<void>;
};

const BranchContext = createContext<BranchContextType | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [userRole, setUserRole] = useState<BrandRole | BranchRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Supabase auth 상태 감지
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsUserLoaded(true);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsUserLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // 컨텍스트 로드
  const loadContext = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/context');
      if (response.ok) {
        const data = await response.json();
        setCurrentBrand(data.currentBrand);
        setCurrentBranch(data.currentBranch); // 내부용 유지
        setUserRole(data.userRole);
      }
    } catch (error) {
      console.error('Failed to load context:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [user?.id]);

  // 컨텍스트 새로고침
  const refreshContext = useCallback(async () => {
    await loadContext();
  }, [loadContext]);

  // 초기 로드
  useEffect(() => {
    if (isUserLoaded && user?.id) {
      loadContext();
    } else if (isUserLoaded && !user) {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [isUserLoaded, user?.id, loadContext]);

  // 온보딩 리다이렉트: 로그인했지만 브랜드가 없는 경우
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!user) return; // 로그인 안 된 상태면 리다이렉트 안 함

    // 제외 경로 체크
    const isExcludedPath = EXCLUDED_PATHS.some(
      (path) => pathname === path || pathname?.startsWith(path + '/')
    );
    if (isExcludedPath) return;

    // 브랜드가 없으면 온보딩으로
    if (!currentBrand) {
      router.push('/onboarding');
    }
  }, [isInitialized, isLoading, user, currentBrand, pathname, router]);

  return (
    <BranchContext.Provider
      value={{
        currentBrand,
        currentBranch,
        userRole,
        user,
        isLoading,
        isInitialized,
        refreshContext,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

// 현재 지점 ID만 필요할 때 사용 (데이터 저장용)
export function useCurrentBranchId(): string | null {
  const { currentBranch } = useBranch();
  return currentBranch?.id || null;
}

// 현재 브랜드 ID만 필요할 때 사용
export function useCurrentBrandId(): string | null {
  const { currentBrand } = useBranch();
  return currentBrand?.id || null;
}
