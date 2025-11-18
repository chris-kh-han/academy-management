'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'zinc' | 'orange' | 'blue';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // localStorage에서 초기값 가져오기
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'light';
    }
    return 'light';
  });

  // 테마 적용 함수
  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;

    // 기존 테마 클래스 모두 제거
    html.classList.remove('dark', 'theme-zinc', 'theme-orange', 'theme-blue');

    // 새 테마 적용
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else if (newTheme !== 'light') {
      html.classList.add(`theme-${newTheme}`);
    }
  };

  // 초기 테마 적용
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 테마 변경 함수
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 테마 사용 훅
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
