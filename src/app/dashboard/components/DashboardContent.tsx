'use client';

import type { ReactNode } from 'react';
import DashboardErrorBoundary from './DashboardErrorBoundary';

type Props = {
  children: ReactNode;
};

export default function DashboardContent({ children }: Props) {
  return <DashboardErrorBoundary>{children}</DashboardErrorBoundary>;
}
