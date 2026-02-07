'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import {
  ChevronLeft,
  Loader2,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  Activity,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { LiveClock } from '@/components/admin/LiveClock';
import {
  DailyActivityChart,
  ContentTypePieChart,
  UserTypeBarChart,
  ApiAdoptionBarChart,
} from '@/components/admin/charts';

interface AnalyticsData {
  userGrowth: {
    total: number;
    last30Days: number;
    last7Days: number;
    today: number;
  };
  contentGeneration: {
    total: {
      coverLetters: number;
      linkedInMessages: number;
      emailMessages: number;
      all: number;
    };
    last30Days: {
      coverLetters: number;
      linkedInMessages: number;
      emailMessages: number;
      all: number;
    };
  };
  dailyStats: Array<{ date: string; count: number }>;
  userTypeDistribution: Array<{ userType: string; count: number }>;
  mostActiveUsers: Array<{
    id: string;
    email: string;
    userType: string;
    totalContent: number;
  }>;
  apiKeyAdoption: {
    openai: number;
    anthropic: number;
    gemini: number;
  };
  statusDistribution: {
    email: Array<{ status: string; count: number }>;
    linkedIn: Array<{ status: string; count: number }>;
  };
}

const COLORS = {
  FREE: '#64748b',
  PLUS: '#a855f7',
  ADMIN: '#ef4444',
  primary: '#0ea5e9',
  secondary: '#8b5cf6',
  accent: '#10b981',
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { data, isLoading, invalidateAnalytics } = useAdminAnalytics();

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

  if (!data) return null;

  const contentByType = [
    { name: 'Cover Letters', value: data.contentGeneration.total.coverLetters, color: '#f59e0b' },
    { name: 'LinkedIn', value: data.contentGeneration.total.linkedInMessages, color: '#3b82f6' },
    { name: 'Email', value: data.contentGeneration.total.emailMessages, color: '#8b5cf6' },
  ];

  const apiAdoption = [
    { name: 'OpenAI', value: data.apiKeyAdoption.openai },
    { name: 'Claude', value: data.apiKeyAdoption.anthropic },
    { name: 'Gemini', value: data.apiKeyAdoption.gemini },
  ];

  return (
    <AdminLayout>
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-8 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
        </div>

        <LiveClock />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[42px] font-bold text-slate-900 leading-tight">Analytics</h1>
                <p className="text-lg text-slate-500">Platform insights and trends</p>
              </div>
              <Button onClick={invalidateAnalytics} variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{data.userGrowth.total}</div>
            <div className="text-sm text-slate-600 mb-3">Total Users</div>
            <div className="text-xs text-green-600 font-medium">
              +{data.userGrowth.last30Days} this month
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {data.contentGeneration.total.all}
            </div>
            <div className="text-sm text-slate-600 mb-3">Total Content</div>
            <div className="text-xs text-green-600 font-medium">
              +{data.contentGeneration.last30Days.all} this month
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {data.userGrowth.last7Days}
            </div>
            <div className="text-sm text-slate-600 mb-3">New Users (7d)</div>
            <div className="text-xs text-green-600 font-medium">
              +{data.userGrowth.today} today
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {Math.round((data.contentGeneration.total.all / data.userGrowth.total) * 10) / 10}
            </div>
            <div className="text-sm text-slate-600 mb-3">Avg Content/User</div>
            <div className="text-xs text-slate-500">Platform average</div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Activity (Last 30 Days)</h3>
            <DailyActivityChart data={data.dailyStats} />
          </Card>
        </motion.div>

        {/* Content Type Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Content by Type</h3>
            <ContentTypePieChart data={contentByType} />
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Type Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Users by Type</h3>
            <UserTypeBarChart data={data.userTypeDistribution} colors={COLORS} />
          </Card>
        </motion.div>

        {/* API Key Adoption */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">API Key Adoption</h3>
            <ApiAdoptionBarChart data={apiAdoption} />
          </Card>
        </motion.div>
      </div>

      {/* Most Active Users */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Most Active Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Total Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.mostActiveUsers.slice(0, 10).map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.userType === 'ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : user.userType === 'PLUS'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right font-semibold">
                      {user.totalContent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
