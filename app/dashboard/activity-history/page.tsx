'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { 
  Search, 
  FileText, 
  Mail, 
  MessageSquare, 
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Activity {
  id: string;
  activityType: 'COVER_LETTER' | 'LINKEDIN_MESSAGE' | 'EMAIL_MESSAGE';
  companyName: string;
  positionTitle?: string;
  recipient?: string;
  status?: string;
  llmModel?: string;
  isDeleted: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function ActivityHistoryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useActivityHistory({
    page: currentPage,
    search,
    type: typeFilter,
  });

  const activities = data?.activities || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COVER_LETTER':
        return <FileText className="w-4 h-4" />;
      case 'LINKEDIN_MESSAGE':
        return <MessageSquare className="w-4 h-4" />;
      case 'EMAIL_MESSAGE':
        return <Mail className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'COVER_LETTER':
        return 'Cover Letter';
      case 'LINKEDIN_MESSAGE':
        return 'LinkedIn Message';
      case 'EMAIL_MESSAGE':
        return 'Email Message';
      default:
        return type;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'COVER_LETTER':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LINKEDIN_MESSAGE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EMAIL_MESSAGE':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value === 'ALL' ? '' : value);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Activity History</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete record of all your activities. Deleted items are marked but count toward your monthly limit.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search by company, position, or recipient..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={typeFilter || 'ALL'} onValueChange={handleTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="COVER_LETTER">Cover Letters</SelectItem>
                  <SelectItem value="LINKEDIN_MESSAGE">LinkedIn</SelectItem>
                  <SelectItem value="EMAIL_MESSAGE">Emails</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activities List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Activity Log ({pagination.totalCount} total)
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-900 text-5xl font-bold">
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No activities found</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border ${
                        activity.isDeleted ? 'bg-gray-50 dark:bg-gray-900/50 opacity-60' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } transition-colors dark:border-gray-700`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.activityType)}`}>
                            {getActivityIcon(activity.activityType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {activity.companyName}
                              </h3>
                              {activity.isDeleted && (
                                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 text-xs">
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Deleted
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <Badge variant="outline" className={getActivityColor(activity.activityType)}>
                                {getActivityLabel(activity.activityType)}
                              </Badge>
                              {activity.positionTitle && (
                                <span className="truncate">{activity.positionTitle}</span>
                              )}
                              {activity.recipient && (
                                <span className="truncate">To: {activity.recipient}</span>
                              )}
                              {activity.llmModel && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                  {activity.llmModel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ml-4">
                          <Calendar className="w-3 h-3" />
                          {new Date(activity.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
