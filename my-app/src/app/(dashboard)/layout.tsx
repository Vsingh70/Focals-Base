import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="app-desktop-only">
        <Sidebar />
      </div>
      <MobileNav />
      <main className="app-shell" style={{ minHeight: '100vh' }}>
        {children}
      </main>
    </>
  );
}
