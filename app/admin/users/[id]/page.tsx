'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  Loader2,
  FileText,
  MessageSquare,
  Mail,
  User,
  Calendar,
  BarChart3,
  Shield,
  Crown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { LiveClock } from '@/components/admin/LiveClock';

interface Activity {
  id: string;
  type: 'Cover Letter' | 'LinkedIn' | 'Email';
  title: string;
  companyName: string;
  positionTitle?: string;
  status?: string;
  createdAt: string;
  llmModel?: string;
  messageType?: string;
}

interface Resume {
  id: string;
  title: string;
  isDefault: boolean;
  createdAt: string;
}

interface UserData {
  user: {
    id: string;
    email: string;
    userType: string;
    createdAt: string;
    updatedAt: string;
  };
  activities: Activity[];
  resumes: Resume[];
  stats: {
    coverLetters: number;
    linkedInMessages: number;
    emailMessages: number;
    totalContent: number;
    resumes: number;
  };
}

const TYPE_CONFIG = {
  'Cover Letter': {
    icon: FileText,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  LinkedIn: {
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  Email: {
    icon: Mail,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
  GHOST: { label: 'No Response', color: 'bg-slate-100 text-slate-700' },
};

export default function UserActivityPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserActivity = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`);
      if (response.status === 403) {
        router.push('/dashboard');
        return;
      }
      if (!response.ok) throw new Error('Failed to load user activity');

      const userData = await response.json();
      setData(userData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load user activity',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    if (params.id) {
      loadUserActivity(params.id as string);
    }
  }, [params.id, loadUserActivity]);

  if (loading) {
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

  const getUserTypeIcon = () => {
    if (data.user.userType === 'ADMIN') return <Shield className="w-5 h-5" />;
    if (data.user.userType === 'PLUS') return <Crown className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  const getUserTypeBadgeColor = () => {
    if (data.user.userType === 'ADMIN') return 'bg-red-100 text-red-700 border-red-200';
    if (data.user.userType === 'PLUS') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <AdminLayout>
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-8 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-bold text-slate-900">User Details</h2>
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
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Users
              </Button>
            </div>

        {/* User Info Card */}
        <Card className="bg-white border-slate-200/60 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                {data.user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{data.user.email}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getUserTypeBadgeColor()} flex items-center gap-1`}>
                    {getUserTypeIcon()}
                    {data.user.userType}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Member since {new Date(data.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data.stats.totalContent}</div>
                <div className="text-sm text-slate-600">Total Content</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data.stats.coverLetters}</div>
                <div className="text-sm text-slate-600">Cover Letters</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data.stats.linkedInMessages}</div>
                <div className="text-sm text-slate-600">LinkedIn</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data.stats.emailMessages}</div>
                <div className="text-sm text-slate-600">Emails</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Activity Timeline</h2>
            <Badge variant="secondary">{data.activities.length} activities</Badge>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {data.activities.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No activity yet</div>
            ) : (
              data.activities.map((activity, index) => {
                const config = TYPE_CONFIG[activity.type];
                const Icon = config.icon;

                return (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${config.color} border flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {activity.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {activity.positionTitle && `${activity.positionTitle} • `}
                              {activity.companyName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {activity.status && STATUS_CONFIG[activity.status] && (
                              <Badge variant="secondary" className={STATUS_CONFIG[activity.status].color}>
                                {STATUS_CONFIG[activity.status].label}
                              </Badge>
                            )}
                            <Badge variant="outline" className={config.color}>
                              {activity.type}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(activity.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {activity.llmModel && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                              {activity.llmModel}
                            </span>
                          )}
                          {activity.messageType && activity.messageType === 'FOLLOW_UP' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              Follow-up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>

      {/* Resumes Section */}
      {data.resumes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-white border-slate-200/60 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Resumes ({data.resumes.length})
            </h3>
            <div className="space-y-3">
              {data.resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{resume.title}</div>
                      <div className="text-xs text-slate-500">
                        Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {resume.isDefault && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Default
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
        </div>
      </div>
    </AdminLayout>
  );
}
