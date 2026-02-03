'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl bg-red-50 p-8'>
          <div className='rounded-full bg-red-100 p-4'>
            <AlertTriangle className='h-8 w-8 text-red-600' />
          </div>
          <h2 className='text-xl font-semibold text-slate-800'>
            대시보드 로딩 중 오류가 발생했습니다
          </h2>
          <p className='max-w-md text-center text-sm text-slate-600'>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Button
            onClick={this.handleRetry}
            variant='outline'
            className='mt-2 gap-2'
          >
            <RefreshCw className='h-4 w-4' />
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
