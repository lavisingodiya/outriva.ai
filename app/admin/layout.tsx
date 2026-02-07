'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdminAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login?redirectTo=/admin');
        return;
      }

      // Once auth status is loaded, redirect non-admins
      if (!isLoading && !isAdmin) {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router, isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-slate-900 text-5xl font-bold">
          <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
