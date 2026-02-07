'use client';

import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Mail, ArrowRight, TrendingUp, Clock, ArrowUpRight, Reply, Trash2, Sparkles, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useToast } from '@/hooks/use-toast';

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [value, spring, display]);

  return <>{displayValue}</>;
}

const QUICK_ACTIONS = [
  {
    title: 'Cover Letters',
    description: 'Tailored applications',
    href: '/dashboard/cover-letter',
    icon: FileText,
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50/80',
    iconBg: 'bg-amber-500',
    textColor: 'text-amber-900',
  },
  {
    title: 'LinkedIn',
    description: 'Network outreach',
    href: '/dashboard/linkedin',
    icon: MessageSquare,
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50/80',
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-900',
  },
  {
    title: 'Emails',
    description: 'Professional messages',
    href: '/dashboard/email',
    icon: Mail,
    bgColor: 'bg-gradient-to-br from-slate-50 to-gray-100/80',
    iconBg: 'bg-slate-500',
    textColor: 'text-slate-900',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Use custom hook for dashboard stats with caching
  const { data: stats, isLoading: loading, error, refreshStats } = useDashboardStats();

  const totalGenerated = (stats?.totalCoverLetters || 0) + (stats?.totalLinkedInMessages || 0) + (stats?.totalEmails || 0);

  // Handle follow-up button click
  const handleFollowup = (activity: any) => {
    const params = new URLSearchParams({
      followup: 'true',
      id: activity.id,
      positionTitle: activity.position,
      companyName: activity.company,
    });

    // Add specific data based on type
    if (activity.data) {
      Object.keys(activity.data).forEach(key => {
        if (activity.data[key]) {
          params.set(key, activity.data[key]);
        }
      });
    }

    const route = activity.type === 'LinkedIn'
      ? '/dashboard/linkedin'
      : '/dashboard/email';

    router.push(`${route}?${params.toString()}`);
  };

  // Handle delete button click
  const handleDelete = async (activity: any) => {
    if (!confirm(`Are you sure you want to delete this ${activity.type}?`)) {
      return;
    }

    try {
      const endpoint = activity.type === 'Cover Letter'
        ? `/api/cover-letters/${activity.id}`
        : activity.type === 'LinkedIn'
        ? `/api/linkedin-messages/${activity.id}`
        : `/api/email-messages/${activity.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${activity.type} deleted successfully`,
        });
        refreshStats(); // Refresh dashboard stats
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-[42px] font-bold text-slate-900 dark:text-gray-100 mb-2 leading-tight">
          Your Dashboard
        </h1>
        <p className="text-lg text-slate-500 dark:text-gray-400">
          Track your progress and manage your generated content
        </p>
      </motion.div>

      {/* Stats & Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 mb-6 md:mb-8">
        {/* Quick Action Cards */}
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          let count = 0;
          if (action.title === 'Cover Letters') count = stats?.totalCoverLetters || 0;
          else if (action.title === 'LinkedIn') count = stats?.totalLinkedInMessages || 0;
          else if (action.title === 'Emails') count = stats?.totalEmails || 0;

          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link href={action.href} className="block h-full">
                <Card className={`relative overflow-hidden border border-slate-200/60 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md dark:shadow-lg transition-all duration-300 cursor-pointer group h-full ${action.bgColor} dark:bg-gray-800`}>
                  <div className="p-4 sm:p-5 md:p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4 md:mb-5 lg:mb-6">
                      <div className="flex-1">
                        <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-0.5 line-clamp-1">
                          {action.title}
                        </h3>
                        <p className="text-xs md:text-sm text-slate-600 line-clamp-1">{action.description}</p>
                      </div>
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] ${action.iconBg} flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity flex-shrink-0`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className={`text-[40px] sm:text-[56px] font-bold leading-none ${action.textColor}`}>
                        {loading ? (
                          <>
                            <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                            <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                            <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                          </>
                        ) : <AnimatedNumber value={count} />}
                      </span>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/90 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}

        {/* Stats Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white shadow-lg h-full">
            <div className="p-4 sm:p-5 md:p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 md:gap-2.5 mb-4 md:mb-5 lg:mb-6">
                  <div className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-[12px] md:rounded-[14px] bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl md:text-[28px] lg:text-[32px] font-bold leading-none">
                      {loading ? (
                        <>
                          <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </>
                      ) : (
                        <>
                          <AnimatedNumber value={totalGenerated} />+
                        </>
                      )}
                    </p>
                    <p className="text-sm text-slate-300">generated</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-2.5">
                <div className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-[12px] md:rounded-[14px] bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl md:text-[28px] lg:text-[32px] font-bold leading-none">
                    {loading ? (
                      <>
                        <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </>
                    ) : <AnimatedNumber value={stats?.hoursSaved || 0} />}
                  </p>
                  <p className="text-sm text-slate-300">hours saved</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content - Left Side (2/3) */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 md:mb-5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-gray-100 mb-1">
                  Latest activity
                </h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">Track your recent generations</p>
              </div>
              <Link href="/dashboard/activity-history">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <Card className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                <div className="p-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-gray-700 last:border-0">
                      <div className="w-14 h-14 rounded-[14px] bg-slate-200 dark:bg-gray-700 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="w-16 h-8 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </Card>
            ) : !stats || stats.recentActivity.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                <div className="p-16 text-center">
                  <div className="w-20 h-20 rounded-[20px] bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-slate-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">No activity yet</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Start by creating your first cover letter, email, or LinkedIn message
                  </p>
                  <Link href="/dashboard/cover-letter">
                    <Button className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <>
                {/* Desktop Table View */}
                <Card className="hidden lg:block bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-gray-700">
                          <th className="text-left text-sm font-semibold text-slate-700 dark:text-gray-300 py-4 px-6">
                            Application
                          </th>
                          <th className="text-left text-sm font-semibold text-slate-700 dark:text-gray-300 py-4 px-4">
                            Date
                          </th>
                          <th className="text-center text-sm font-semibold text-slate-700 dark:text-gray-300 py-4 px-4">
                            Status
                          </th>
                          <th className="text-center text-sm font-semibold text-slate-700 dark:text-gray-300 py-4 px-4">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentActivity.map((activity, index) => {
                          const Icon =
                            activity.type === 'Cover Letter'
                              ? FileText
                              : activity.type === 'LinkedIn'
                              ? MessageSquare
                              : Mail;
                          const iconBg =
                            activity.type === 'Cover Letter'
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                              : activity.type === 'LinkedIn'
                              ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                              : 'bg-gradient-to-br from-slate-400 to-gray-500';

                          return (
                            <motion.tr
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                              className="border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50/50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <div className={`w-14 h-14 rounded-[14px] ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-gray-100 text-[15px] mb-0.5">
                                      {activity.position}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-gray-400">
                                      {activity.company}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-4">
                                <p className="text-sm text-slate-600 dark:text-gray-400">
                                  {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </td>
                              <td className="text-center py-5 px-4">
                                {activity.type === 'Cover Letter' ? (
                                  <span className="text-sm text-slate-400 dark:text-gray-500">—</span>
                                ) : (
                                  <Badge
                                    variant={
                                      activity.status === 'SENT' ? 'default' :
                                      activity.status === 'DONE' ? 'secondary' :
                                      activity.status === 'GHOST' ? 'destructive' : 'outline'
                                    }
                                    className="font-medium"
                                  >
                                    {activity.status}
                                  </Badge>
                                )}
                              </td>
                              <td className="text-center py-5 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Follow-up button for LinkedIn/Email NEW messages without follow-ups */}
                                  {(activity.type === 'LinkedIn' || activity.type === 'Email') &&
                                   activity.messageType === 'NEW' &&
                                   !activity.hasFollowUp && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleFollowup(activity)}
                                      className="h-8 text-xs"
                                    >
                                      <Reply className="w-3 h-3 mr-1" />
                                      Follow-up
                                    </Button>
                                  )}

                                  {/* "Followed up" status for NEW messages that have follow-ups */}
                                  {(activity.type === 'LinkedIn' || activity.type === 'Email') &&
                                   activity.messageType === 'NEW' &&
                                   activity.hasFollowUp && (
                                    <Badge variant="secondary" className="text-xs">
                                      Followed up
                                    </Badge>
                                  )}

                                  {/* "Follow-up sent" status for follow-up messages */}
                                  {activity.messageType === 'FOLLOW_UP' && (
                                    <Badge variant="outline" className="text-xs">
                                      Follow-up sent
                                    </Badge>
                                  )}

                                  {/* Delete button only for cover letters and NEW messages (not follow-ups) */}
                                  {(activity.type === 'Cover Letter' || activity.messageType === 'NEW') && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDelete(activity)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden space-y-3">
                  {stats?.recentActivity.map((activity, index) => {
                    const Icon =
                      activity.type === 'Cover Letter'
                        ? FileText
                        : activity.type === 'LinkedIn'
                        ? MessageSquare
                        : Mail;
                    const iconBg =
                      activity.type === 'Cover Letter'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : activity.type === 'LinkedIn'
                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                        : 'bg-gradient-to-br from-slate-400 to-gray-500';

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
                          <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`w-12 h-12 rounded-[12px] ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-gray-100 text-sm mb-0.5 truncate">
                                  {activity.position}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                                  {activity.company}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                                  {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-gray-700">
                              <div className="flex items-center gap-2 flex-1">
                                {activity.type === 'Cover Letter' ? (
                                  <span className="text-xs text-slate-400 dark:text-gray-500">No status</span>
                                ) : (
                                  <Badge
                                    variant={
                                      activity.status === 'SENT' ? 'default' :
                                      activity.status === 'DONE' ? 'secondary' :
                                      activity.status === 'GHOST' ? 'destructive' : 'outline'
                                    }
                                    className="text-xs font-medium"
                                  >
                                    {activity.status}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Follow-up button for LinkedIn/Email NEW messages without follow-ups */}
                                {(activity.type === 'LinkedIn' || activity.type === 'Email') &&
                                 activity.messageType === 'NEW' &&
                                 !activity.hasFollowUp && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleFollowup(activity)}
                                    className="h-8 text-xs px-2"
                                  >
                                    <Reply className="w-3 h-3 mr-1" />
                                    Follow-up
                                  </Button>
                                )}

                                {/* "Followed up" status for NEW messages that have follow-ups */}
                                {(activity.type === 'LinkedIn' || activity.type === 'Email') &&
                                 activity.messageType === 'NEW' &&
                                 activity.hasFollowUp && (
                                  <Badge variant="secondary" className="text-xs">
                                    Followed up
                                  </Badge>
                                )}

                                {/* "Follow-up sent" status for follow-up messages */}
                                {activity.messageType === 'FOLLOW_UP' && (
                                  <Badge variant="outline" className="text-xs">
                                    Follow-up sent
                                  </Badge>
                                )}

                                {/* Delete button only for cover letters and NEW messages (not follow-ups) */}
                                {(activity.type === 'Cover Letter' || activity.messageType === 'NEW') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(activity)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Right Sidebar - Stats */}
        <div className="space-y-4 md:space-y-6">
          {/* Usage Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700">
              <div className="p-5 md:p-6 lg:p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-1">Your usage</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">
                      Current plan: {loading ? (
                        <span className="inline-block w-12 h-4 bg-slate-200 rounded animate-pulse"></span>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-gray-300">{stats?.userType === 'FREE' ? 'Free' : stats?.userType === 'PLUS' ? 'Plus' : 'Admin'}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {/* Activities Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 p-5 sm:p-6 hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 h-full">
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-bl from-blue-200 to-transparent dark:from-blue-800/30 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg mb-3 flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 h-4">Activities</p>
                        <div className="h-10 mb-2 flex items-center">
                          <p className="text-3xl font-bold text-slate-900 dark:text-gray-100 leading-tight">
                            {loading ? (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="inline-flex gap-1"
                              >
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                              </motion.span>
                            ) : (
                              <AnimatedNumber value={stats?.activityCount || 0} />
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-500">Unlimited for Admin</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Generations Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-gray-700 bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 p-5 sm:p-6 hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 h-full">
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-bl from-purple-200 to-transparent dark:from-purple-800/30 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg mb-3 flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 h-4">Generations</p>
                        <div className="h-10 mb-2 flex items-center">
                          <p className="text-3xl font-bold text-slate-900 dark:text-gray-100 leading-tight">
                            {loading ? (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="inline-flex gap-1"
                              >
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                              </motion.span>
                            ) : (
                              <AnimatedNumber value={stats?.generationCount || 0} />
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-500">Unlimited for Admin</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Followup Generations Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-orange-900/10 dark:to-amber-900/10 p-5 sm:p-6 hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 h-full">
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-bl from-orange-200 to-transparent dark:from-orange-800/30 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg mb-3 flex-shrink-0">
                          <Send className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 h-4 line-clamp-1">Followup Gen.</p>
                        <div className="h-10 mb-2 flex items-center">
                          <p className="text-3xl font-bold text-slate-900 dark:text-gray-100 leading-tight">
                            {loading ? (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="inline-flex gap-1"
                              >
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                                <motion.span
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                  className="inline-block w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full"
                                />
                              </motion.span>
                            ) : (
                              <AnimatedNumber value={stats?.followupGenerationCount || 0} />
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-500">Unlimited for Admin</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Usage Progress Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {/* Activities Usage Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Usage</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                          {loading ? '...' : <>Unlimited</>}
                        </p>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Generations Usage Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Usage</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                          {loading ? '...' : <>Unlimited</>}
                        </p>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Followup Generations Usage Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Usage</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                          {loading ? '...' : <>Unlimited</>}
                        </p>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Monthly Usage Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-2xl border border-slate-200/60 dark:border-gray-700 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-gray-800 dark:to-gray-800/50 p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Monthly Summary</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Resets in {loading ? '...' : <>{stats?.daysUntilReset || 0} days</>}</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-gray-300">
                    {loading ? (
                      <>
                        <span className="inline-block w-3 h-3 bg-slate-300 dark:bg-gray-700 rounded animate-pulse"></span>
                        {' items used of '}
                        <span className="inline-block w-8 h-3 bg-slate-300 dark:bg-gray-700 rounded animate-pulse"></span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold"><AnimatedNumber value={stats?.monthlyCount || 0} /></span> of <span className="font-bold">{stats?.monthlyLimit || 0}</span> items saved this month
                      </>
                    )}
                  </p>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Tip Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/60 dark:border-blue-800/60">
              <div className="p-4 md:p-5 lg:p-6">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] md:rounded-[12px] bg-blue-500 flex items-center justify-center mb-3 md:mb-4">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-gray-100 mb-2 md:mb-2.5">Pro tip</h3>
                <p className="text-xs md:text-sm lg:text-[15px] text-slate-700 dark:text-gray-300 leading-relaxed">
                  Upload your resume in{' '}
                  <Link href="/dashboard/settings" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    Settings
                  </Link>{' '}
                  to generate more personalized content tailored to your experience.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
