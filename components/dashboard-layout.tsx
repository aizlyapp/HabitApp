'use client';

import { ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950">
      {sidebar}
      <main className="flex-1 overflow-y-auto lg:ml-0 pl-14 md:pl-0">
        {children}
      </main>
    </div>
  );
}
