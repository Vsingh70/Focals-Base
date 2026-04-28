'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from './Toast';
import { ConfirmProvider } from './ConfirmDialog';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
