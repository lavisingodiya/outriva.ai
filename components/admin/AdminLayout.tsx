'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Shield, Users, FileText, BarChart3, Home, Settings as SettingsIcon, LogOut, ChevronDown, KeyRound } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Footer } from '@/components/Footer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const supabase = createClient();

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [supabase]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const navItems = [
    { icon: Shield, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: SettingsIcon, label: 'Settings', path: '/admin/settings' },
    { icon: Home, label: 'User Dashboard', path: '/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>

      {/* Left Sidebar - Fixed */}
      <div className="w-[280px] bg-white shadow-[2px_0_8px_rgba(0,0,0,0.04)] flex-shrink-0 flex flex-col fixed left-0 top-0 h-screen">
        <div className="flex-1 p-6">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">ADMIN</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Navigation</div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md shadow-slate-800/20'
                        : 'text-slate-600 hover:bg-slate-50 group'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        isActive ? '' : 'text-slate-400 group-hover:text-slate-600 transition-colors'
                      }`}
                      strokeWidth={2}
                    />
                    <span className={isActive ? 'font-semibold' : 'font-medium'}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-t border-slate-100">
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-all duration-200 mb-2 w-full">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex-shrink-0 shadow-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{userEmail ? userEmail[0].toUpperCase() : 'A'}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-slate-900 truncate">{userEmail || 'admin@...'}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3 h-3 text-red-600" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold tracking-wide text-red-600">Admin</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <KeyRound className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content - With left margin to accommodate fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 ml-[280px] h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <Footer variant="compact" isDark={false} />
      </div>
    </div>
  );
}
