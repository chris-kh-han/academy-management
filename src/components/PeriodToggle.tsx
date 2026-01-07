'use client';

type PeriodOption<T extends string | number> = {
  value: T;
  label: string;
};

type PeriodToggleProps<T extends string | number> = {
  value: T;
  onChange: (value: T) => void;
  options: PeriodOption<T>[];
};

export default function PeriodToggle<T extends string | number>({
  value,
  onChange,
  options,
}: PeriodToggleProps<T>) {
  return (
    <div className='flex gap-0.5 rounded-lg bg-slate-100 p-0.5'>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            value === option.value
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// 자주 사용하는 기간 옵션 프리셋
export const PERIOD_OPTIONS_7_30 = [
  { value: 7 as const, label: '7일' },
  { value: 30 as const, label: '30일' },
];
