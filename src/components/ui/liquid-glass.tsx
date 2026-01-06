import * as React from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  glowIntensity?: 'sm' | 'md' | 'lg';
  shadowIntensity?: 'sm' | 'md' | 'lg';
  borderRadius?: string;
  children: React.ReactNode;
}

const blurMap = {
  sm: 'backdrop-blur-md',
  md: 'backdrop-blur-xl',
  lg: 'backdrop-blur-2xl',
  xl: 'backdrop-blur-3xl',
};

const shadowMap = {
  sm: 'shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
  md: 'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
  lg: 'shadow-[0_12px_48px_rgba(0,0,0,0.1)]',
};

const glowMap = {
  sm: '',
  md: 'ring-1 ring-white/10',
  lg: 'ring-1 ring-white/20',
};

function LiquidGlassCard({
  className,
  blurIntensity = 'lg',
  glowIntensity = 'md',
  shadowIntensity = 'md',
  borderRadius = '16px',
  children,
  style,
  ...props
}: LiquidGlassCardProps) {
  return (
    <div
      className={cn(
        // Apple liquid glass - 매우 연한 반투명
        'bg-white/10',
        // 강한 backdrop blur
        blurMap[blurIntensity],
        // 미세한 유리 테두리
        'border border-white/15',
        // 부드러운 그림자
        shadowMap[shadowIntensity],
        // glow 효과
        glowMap[glowIntensity],
        className,
      )}
      style={{
        borderRadius,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export { LiquidGlassCard };
export type { LiquidGlassCardProps };
