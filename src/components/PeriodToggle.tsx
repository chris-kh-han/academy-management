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
    <div className='flex gap-1 rounded-lg bg-muted p-1'>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
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
