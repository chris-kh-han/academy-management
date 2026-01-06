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

type BranchContextType = {
  // 현재 상태
  currentBrand: Brand | null;
  currentBranch: Branch | null;
  userRole: BrandRole | BranchRole | null;
  availableBranches: Branch[];
  user: User | null;

  // 로딩 상태
  isLoading: boolean;
  isInitialized: boolean;

  // 액션
  switchBranch: (branchId: string) => Promise<void>;
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
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
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
        setCurrentBranch(data.currentBranch);
        setUserRole(data.userRole);
        setAvailableBranches(data.availableBranches);
      }
    } catch (error) {
      console.error('Failed to load branch context:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [user?.id]);

  // 지점 전환
  const switchBranch = useCallback(
    async (branchId: string) => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/user/switch-branch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchId }),
        });

        if (response.ok) {
          await loadContext();
        }
      } catch (error) {
        console.error('Failed to switch branch:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, loadContext]
  );

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

  // 온보딩 리다이렉트: 로그인했지만 브랜드/지점이 없는 경우
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!user) return; // 로그인 안 된 상태면 리다이렉트 안 함

    // 제외 경로 체크
    const isExcludedPath = EXCLUDED_PATHS.some(
      (path) => pathname === path || pathname?.startsWith(path + '/')
    );
    if (isExcludedPath) return;

    // 브랜드/지점 둘 다 없으면 온보딩으로
    if (!currentBrand && !currentBranch) {
      router.push('/onboarding');
    }
  }, [
    isInitialized,
    isLoading,
    user,
    currentBrand,
    currentBranch,
    pathname,
    router,
  ]);

  return (
    <BranchContext.Provider
      value={{
        currentBrand,
        currentBranch,
        userRole,
        availableBranches,
        user,
        isLoading,
        isInitialized,
        switchBranch,
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

// 현재 지점 ID만 필요할 때 사용
export function useCurrentBranchId(): string | null {
  const { currentBranch } = useBranch();
  return currentBranch?.id || null;
}

// 현재 브랜드 ID만 필요할 때 사용
export function useCurrentBrandId(): string | null {
  const { currentBrand } = useBranch();
  return currentBrand?.id || null;
}
