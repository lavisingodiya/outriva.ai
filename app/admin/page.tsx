'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, FileText, MessageSquare, TrendingUp, BarChart3, Search, Bell, MoreHorizontal, Home, Briefcase, UserCircle, Settings as SettingsIcon, Plus, ChevronRight, LogOut, Clock, Activity, ArrowUpRight, Key, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, useSpring, useTransform } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { LiveClock } from '@/components/admin/LiveClock';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useQueryClient } from '@tanstack/react-query';

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  // Re-add useEffect import for AnimatedNumber
  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [value, spring, display]);

  return <>{displayValue}</>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [backfilling, setBackfilling] = useState(false);
  const supabase = createClient();

  const { data, isLoading, error: queryError } = useAdminDashboard();
  const stats = data?.stats || null;
  const recentUsers = data?.recentUsers || [];
  const error = queryError?.message || '';

  const handleBackfillActivity = async () => {
    if (!confirm('This will backfill the activity history with all existing cover letters, LinkedIn messages, and email messages. Continue?')) {
      return;
    }

    setBackfilling(true);
    try {
      const response = await fetch('/api/admin/backfill-activity', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to backfill activity history');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message || `Backfilled ${result.backfilledCount} records`,
      });

      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    } catch (error: any) {
      logger.error('Backfill error', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to backfill activity history',
        variant: 'destructive',
      });
    } finally {
      setBackfilling(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-900 text-5xl font-bold">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600 text-sm">Error: {error}</div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  return (
    <AdminLayout>
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-8 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Admin Dashboard</h2>
        </div>
        <LiveClock />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="p-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-[42px] font-bold text-slate-900 mb-2 leading-tight">Platform Overview</h1>
              <p className="text-lg text-slate-500">Monitor system health, user activity, and content generation</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 * 0.08 }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/80 rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 mb-0.5">Total Users</h3>
                      <p className="text-sm text-slate-600">All registered users</p>
                    </div>
                    <div className="w-11 h-11 rounded-[14px] bg-blue-500 flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                      <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[56px] font-bold leading-none text-blue-900">
                      <AnimatedNumber value={stats.users.total} />
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-blue-100/60">
                    <div>
                      <div className="text-[10px] text-blue-600/70 mb-1 font-semibold uppercase">Free</div>
                      <div className="text-base font-bold text-blue-900">{stats.users.free}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-600/70 mb-1 font-semibold uppercase">Plus</div>
                      <div className="text-base font-bold text-blue-900">{stats.users.plus}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-600/70 mb-1 font-semibold uppercase">Admin</div>
                      <div className="text-base font-bold text-blue-900">{stats.users.admin}</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Content Generated Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 * 0.08 }}
              >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 mb-0.5">Content Generated</h3>
                      <p className="text-sm text-slate-600">All content created</p>
                    </div>
                    <div className="w-11 h-11 rounded-[14px] bg-amber-500 flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                      <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[56px] font-bold leading-none text-amber-900">
                      <AnimatedNumber value={stats.content.totalGenerated} />
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-amber-100/60">
                    <div>
                      <div className="text-[10px] text-amber-600/70 mb-1 font-semibold uppercase">Cover</div>
                      <div className="text-base font-bold text-amber-900">{stats.content.coverLetters}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-600/70 mb-1 font-semibold uppercase">LinkedIn</div>
                      <div className="text-base font-bold text-amber-900">{stats.content.linkedInMessages}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-600/70 mb-1 font-semibold uppercase">Email</div>
                      <div className="text-base font-bold text-amber-900">{stats.content.emailMessages}</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Resumes Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 * 0.08 }}
              >
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50/80 rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 mb-0.5">Resumes</h3>
                      <p className="text-sm text-slate-600">Documents uploaded</p>
                    </div>
                    <div className="w-11 h-11 rounded-[14px] bg-teal-500 flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                      <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[56px] font-bold leading-none text-teal-900">
                      <AnimatedNumber value={stats.content.resumes} />
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* API Keys Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 * 0.08 }}
              >
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border-0 text-white shadow-lg h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-white mb-0.5">API Keys</h3>
                      <p className="text-sm text-slate-300">Configured keys</p>
                    </div>
                    <div className="w-11 h-11 rounded-[14px] bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[56px] font-bold leading-none text-white">
                      <AnimatedNumber value={stats.apiKeys.openai + stats.apiKeys.anthropic + stats.apiKeys.gemini} />
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">OpenAI</div>
                      <div className="text-base font-bold text-white">{stats.apiKeys.openai}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Claude</div>
                      <div className="text-base font-bold text-white">{stats.apiKeys.anthropic}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Gemini</div>
                      <div className="text-base font-bold text-white">{stats.apiKeys.gemini}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="lg:col-span-2"
              >
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">Recent Users</h3>
                    <button
                      onClick={() => router.push('/admin/users')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      View All <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </div>
                <div className="space-y-3">
                  {recentUsers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No users yet</div>
                  ) : (
                    recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{user.email}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <Clock className="w-3 h-3" strokeWidth={2} />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-slate-500">{user.stats.totalMessages} msgs</div>
                          <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            user.userType === 'ADMIN' ? 'bg-red-100 text-red-700' :
                            user.userType === 'PLUS' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {user.userType}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-base font-bold text-slate-900 mb-6 uppercase tracking-wide">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="w-full group bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                      <div>
                        <div className="font-bold text-white text-sm">Manage Users</div>
                        <div className="text-xs text-blue-100">View, edit, and delete users</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/analytics')}
                    className="w-full group bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-4 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-white" strokeWidth={2.5} />
                      <div>
                        <div className="font-bold text-white text-sm">Analytics</div>
                        <div className="text-xs text-violet-100">View detailed insights</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/settings')}
                    className="w-full group bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
                      <div>
                        <div className="font-bold text-white text-sm">Settings</div>
                        <div className="text-xs text-emerald-100">Configure limits</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/shared-keys')}
                    className="w-full group bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Key className="w-6 h-6 text-white" strokeWidth={2.5} />
                      <div>
                        <div className="font-bold text-white text-sm">Shared API Keys</div>
                        <div className="text-xs text-purple-100">PLUS user keys</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleBackfillActivity}
                    disabled={backfilling}
                    className="w-full group bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-6 h-6 text-white" strokeWidth={2.5} />
                      <div>
                        <div className="font-bold text-white text-sm">
                          {backfilling ? 'Backfilling...' : 'Backfill Activity History'}
                        </div>
                        <div className="text-xs text-amber-100">Sync existing data</div>
                      </div>
                    </div>
                  </button>
                </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
