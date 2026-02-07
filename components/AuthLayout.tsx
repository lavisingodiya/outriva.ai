'use client';

import { ReactNode } from 'react';
import { Footer } from '@/components/Footer';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3]">
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
      <Footer variant="compact" isDark={false} />
    </div>
  );
}
