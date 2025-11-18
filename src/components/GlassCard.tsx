// components/GlassCard.tsx
// Apple Liquid Glass UI 스타일 카드 컴포넌트
import React from 'react';

export default function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-[100px] bg-cover bg-center bg-no-repeat rounded-md'>
      <div className='w-full bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] p-6 relative before:absolute before:inset-0 before:rounded-lg before:bg-linear-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-linear-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none'>
        {children}
      </div>
    </div>
  );
}
