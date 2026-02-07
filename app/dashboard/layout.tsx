'use client';

import { FileText, Mail, MessageSquare, History, Settings, User, LayoutDashboard, KeyRound, LogOut, ChevronDown, Shield, Crown, Menu, X, ChevronLeft, ChevronRight, FolderKanban, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Footer } from '@/components/Footer';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsBell } from '@/components/NotificationsBell';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cover Letter', href: '/dashboard/cover-letter', icon: FileText },
  { name: 'LinkedIn', href: '/dashboard/linkedin', icon: MessageSquare },
  { name: 'Email', href: '/dashboard/email', icon: Mail },
  { name: 'Manage', href: '/dashboard/manage', icon: FolderKanban },
  { name: 'Activity History', href: '/dashboard/activity-history', icon: Clock },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Use shared hook for user profile
  const { profile, isLoading: loadingProfile } = useUserProfile();
  const userType = profile?.userType || 'FREE';
  
  // Use shared hook for admin auth
  const { isAdmin } = useAdminAuth();

  // Helper function to format user type for display
  const formatUserType = (type: string) => {
    const typeMap: Record<string, string> = {
      'FREE': 'Free',
      'PLUS': 'Plus',
      'ADMIN': 'Admin'
    };
    return typeMap[type] || type;
  };

  // Load sidebar state from localStorage after component mounts
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, isMounted]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      
      router.push('/');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Collapsible on desktop, drawer on mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-[#f5f5f5] dark:bg-gray-800 flex flex-col transition-all duration-300 ease-in-out z-50",
        isSidebarCollapsed ? "w-[80px]" : "w-[280px]",
        "lg:translate-x-0",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 pt-6 pb-8 hover:opacity-80 transition-opacity relative">
          <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">AJ</span>
          </div>
          <span className={cn(
            "text-xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
          )}>AI Job Master</span>
        </Link>

          {/* Collapse button - Desktop only */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-lg transition-all shadow-md z-[60]"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
            )}
          </button>

          {/* Close button - Mobile only */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute right-4 top-4 p-2 hover:bg-white/40 dark:hover:bg-gray-700/40 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto overflow-x-hidden">
          {/* Main Section */}
          <div className="mb-6">
            <div className={cn(
              "px-3 mb-3 transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100 h-auto"
            )}>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Tools</span>
            </div>
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-normal transition-all",
                      isActive
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/40 dark:hover:bg-gray-700/40",
                      isSidebarCollapsed && "justify-center"
                    )}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                    <span className={cn(
                      "whitespace-nowrap transition-all duration-300 ease-in-out",
                      isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                    )}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <div className={cn(
              "px-3 mb-3 transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100 h-auto"
            )}>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Other</span>
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/settings"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-normal transition-all",
                  pathname === '/dashboard/settings'
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/40 dark:hover:bg-gray-700/40",
                  isSidebarCollapsed && "justify-center"
                )}
                title={isSidebarCollapsed ? "Settings" : undefined}
              >
                <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <span className={cn(
                  "whitespace-nowrap transition-all duration-300 ease-in-out",
                  isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                )}>Settings</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-normal transition-all",
                    pathname?.startsWith('/admin')
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/40 dark:hover:bg-gray-700/40",
                    isSidebarCollapsed && "justify-center"
                  )}
                  title={isSidebarCollapsed ? "Admin Dashboard" : undefined}
                >
                  <Shield className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                  )}>Admin Dashboard</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-300/50 dark:border-gray-700/50 mt-auto flex-shrink-0">
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center rounded-xl hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all w-full mb-3",
                isSidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5"
              )}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-sm">{profile?.email ? profile.email[0].toUpperCase() : 'U'}</span>
                </div>
                <div className={cn(
                  "flex-1 min-w-0 text-left transition-all duration-300 ease-in-out",
                  isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                )}>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate whitespace-nowrap">{profile?.email || 'Loading...'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {userType === 'ADMIN' && <Shield className="w-3 h-3 text-red-600 flex-shrink-0" strokeWidth={2.5} />}
                    {userType === 'PLUS' && <Crown className="w-3 h-3 text-purple-600 flex-shrink-0" strokeWidth={2.5} />}
                    <span className={cn(
                      "text-[10px] font-bold tracking-wide whitespace-nowrap",
                      userType === 'ADMIN' ? 'text-red-600' :
                      userType === 'PLUS' ? 'text-purple-600' :
                      'text-gray-500'
                    )}>{formatUserType(userType)}</span>
                  </div>
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-0' : 'rotate-180'}`} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isSidebarCollapsed && (
                <>
                  <div className="px-2 py-2 text-sm border-b border-gray-200">
                    <p className="font-semibold text-gray-900 truncate">{profile?.email || 'Loading...'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {userType === 'ADMIN' && <Shield className="w-3 h-3 text-red-600" strokeWidth={2.5} />}
                      {userType === 'PLUS' && <Crown className="w-3 h-3 text-purple-600" strokeWidth={2.5} />}
                      <span className={`text-xs font-bold ${
                        userType === 'ADMIN' ? 'text-red-600' :
                        userType === 'PLUS' ? 'text-purple-600' :
                        'text-gray-500'
                      }`}>{formatUserType(userType)}</span>
                    </div>
                  </div>
                </>
              )}
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => router.push('/dashboard/settings?tab=password')}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className={cn(
            "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "opacity-0 h-0 p-0 overflow-hidden border-0" : "opacity-100 h-auto w-full"
          )}>
            Upgrade
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        isSidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]"
      )}>
        {/* Top header bar - Mobile navigation + notifications */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            {/* Mobile menu button and logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm sm:text-lg font-bold">AJ</span>
                </div>
                <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100">AI Job Master</span>
              </Link>
            </div>
            
            {/* Dark Mode Toggle & Notifications - always on right */}
            <div className="lg:ml-auto flex items-center gap-2">
              <DarkModeToggle />
              <NotificationsBell />
            </div>
          </div>
        </div>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 transition-colors duration-300">
          <div className="grid grid-cols-6 gap-0.5 px-1 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors",
                    isActive
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                  <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900 pb-20 lg:pb-8 transition-colors duration-300">
        {children}
      </main>

      {/* Footer */}
      <Footer variant="compact" isDark={false} />
    </div>
    </div>
  );
}