'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHistory } from '@/hooks/useHistory';
import { logger } from '@/lib/logger';
import { History as HistoryIcon, Search, Download, Filter, FileText, MessageSquare, Mail, Loader2, Eye, Trash2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getModelDisplayName } from '@/lib/utils/modelNames';

interface HistoryItem {
  id: string;
  type: 'Cover Letter' | 'LinkedIn' | 'Email';
  company: string;
  position: string;
  status?: string;
  createdAt: string;
  content?: string;
  subject?: string;
  body?: string;
  message?: string;
  messageType?: string;
  hasFollowUp?: boolean;
  llmModel?: string;
}

const TYPE_CONFIG = {
  'Cover Letter': {
    icon: FileText,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  'LinkedIn': {
    icon: MessageSquare,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  'Email': {
    icon: Mail,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
  GHOST: { label: 'No Response', color: 'bg-slate-100 text-slate-700' },
};

export default function HistoryPage() {
  const { toast } = useToast();
  const { history, isLoading, invalidateHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [exporting, setExporting] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);

  // Client-side filtering using useMemo
  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.company.toLowerCase().includes(query) ||
        item.position.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [history, typeFilter, statusFilter, searchQuery]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/history/export?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Success', description: 'History exported successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export history', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleViewItem = async (item: HistoryItem) => {
    setLoadingItem(true);
    setViewDialogOpen(true);
    try {
      const endpoint =
        item.type === 'Cover Letter'
          ? `/api/history/cover-letter/${item.id}`
          : item.type === 'LinkedIn'
          ? `/api/history/linkedin/${item.id}`
          : `/api/history/email/${item.id}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch item');

      const data = await response.json();
      setSelectedItem(data.coverLetter || data.message);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load content', variant: 'destructive' });
      setViewDialogOpen(false);
    } finally {
      setLoadingItem(false);
    }
  };

  const handleDeleteItem = async (item: HistoryItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type.toLowerCase()}?`)) {
      return;
    }

    try {
      const endpoint =
        item.type === 'Cover Letter'
          ? `/api/history/cover-letter/${item.id}`
          : item.type === 'LinkedIn'
          ? `/api/history/linkedin/${item.id}`
          : `/api/history/email/${item.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');

      toast({ title: 'Success', description: `${item.type} deleted successfully` });
      invalidateHistory();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const handleFollowUp = async (item: HistoryItem) => {
    // First fetch the full item details to get all fields
    try {
      const endpoint =
        item.type === 'LinkedIn'
          ? `/api/history/linkedin/${item.id}`
          : `/api/history/email/${item.id}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch item');

      const data = await response.json();
      const message = data.message;

      // Build URL parameters
      const params = new URLSearchParams({
        followup: 'true',
        id: item.id,
        positionTitle: message.positionTitle || '',
        companyName: message.companyName || '',
      });

      // Add optional parameters
      if (message.linkedinUrl) params.append('linkedinUrl', message.linkedinUrl);
      if (message.recipientEmail) params.append('recipientEmail', message.recipientEmail);
      if (message.recipientName) params.append('recipientName', message.recipientName);
      if (message.jobDescription) params.append('jobDescription', message.jobDescription);
      if (message.companyDescription) params.append('companyDescription', message.companyDescription);
      if (message.resumeId) params.append('resumeId', message.resumeId);
      if (message.length) params.append('length', message.length);
      if (message.llmModel) params.append('llmModel', message.llmModel);

      // Navigate to the appropriate page
      const targetPage = item.type === 'LinkedIn' ? '/dashboard/linkedin' : '/dashboard/email';
      window.location.href = `${targetPage}?${params.toString()}`;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load message details', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (item: HistoryItem, newStatus: string) => {
    try {
      const endpoint =
        item.type === 'Cover Letter'
          ? `/api/history/cover-letter/${item.id}`
          : item.type === 'LinkedIn'
          ? `/api/history/linkedin/${item.id}`
          : `/api/history/email/${item.id}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({ title: 'Success', description: 'Status updated successfully' });
      invalidateHistory(); // Refresh the list
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3 mb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-[42px] font-bold text-slate-900 dark:text-gray-100 leading-tight">Manage</h1>
              <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-gray-400 leading-snug">
                View and manage all your generated applications
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting || filteredHistory.length === 0}
            variant="outline"
            className="h-10 sm:h-11 text-sm sm:text-base border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 sm:mb-6"
      >
        <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-100/50 dark:border-violet-800/50 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
              Filters
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative sm:col-span-2 md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  placeholder="Search by company or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 sm:h-11 pl-9 sm:pl-10 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="ALL" className="rounded-md text-sm sm:text-base">All Types</SelectItem>
                  <SelectItem value="Cover Letter" className="rounded-md text-sm sm:text-base">Cover Letters</SelectItem>
                  <SelectItem value="LinkedIn" className="rounded-md text-sm sm:text-base">LinkedIn Messages</SelectItem>
                  <SelectItem value="Email" className="rounded-md text-sm sm:text-base">Emails</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="ALL" className="rounded-md text-sm sm:text-base">All Statuses</SelectItem>
                  <SelectItem value="DRAFT" className="rounded-md text-sm sm:text-base">Draft</SelectItem>
                  <SelectItem value="SENT" className="rounded-md text-sm sm:text-base">Sent</SelectItem>
                  <SelectItem value="DONE" className="rounded-md text-sm sm:text-base">Done</SelectItem>
                  <SelectItem value="GHOST" className="rounded-md text-sm sm:text-base">No Response</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100">
                Generated Content
              </h2>
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-xs sm:text-sm">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-gray-700">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 sm:p-12">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] sm:rounded-[16px] bg-slate-100 dark:bg-gray-700 flex items-center justify-center mb-3 sm:mb-4">
                  <HistoryIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-gray-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">No History Found</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 text-center max-w-sm px-4">
                  {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'Try adjusting your filters to see more results'
                    : 'Start generating cover letters, LinkedIn messages, or emails to build your history'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${config.bgColor} border ${config.borderColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.textColor}`} strokeWidth={2} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-gray-100 truncate">
                              {item.position}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 truncate">
                              {item.company}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.status && STATUS_CONFIG[item.status] && (
                              <Select
                                value={item.status}
                                onValueChange={(newStatus) => handleStatusChange(item, newStatus)}
                              >
                                <SelectTrigger className={`h-7 sm:h-7 w-[110px] sm:w-[130px] text-xs sm:text-sm border-0 ${STATUS_CONFIG[item.status].color} hover:opacity-80 transition-opacity`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  <SelectItem value="DRAFT" className="rounded-md text-xs sm:text-sm">Draft</SelectItem>
                                  <SelectItem value="SENT" className="rounded-md text-xs sm:text-sm">Sent</SelectItem>
                                  <SelectItem value="DONE" className="rounded-md text-xs sm:text-sm">Done</SelectItem>
                                  <SelectItem value="GHOST" className="rounded-md text-xs sm:text-sm">No Response</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Badge variant="outline" className={`${config.textColor} ${config.borderColor} text-[10px] sm:text-xs`}>
                              {item.type}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewItem(item)}
                              className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            {/* Follow-up button for NEW messages without follow-ups */}
                            {(item.type === 'LinkedIn' || item.type === 'Email') &&
                             item.messageType === 'NEW' &&
                             !item.hasFollowUp && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFollowUp(item)}
                                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Follow-up</span>
                              </Button>
                            )}
                            {/* "Followed up" status for NEW messages that have follow-ups */}
                            {(item.type === 'LinkedIn' || item.type === 'Email') &&
                             item.messageType === 'NEW' &&
                             item.hasFollowUp && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                Followed up
                              </Badge>
                            )}
                            {/* "Follow-up sent" status for follow-up messages */}
                            {item.messageType === 'FOLLOW_UP' && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs">
                                Follow-up sent
                              </Badge>
                            )}
                            {/* Delete button only for cover letters and NEW messages (not follow-ups) */}
                            {(item.type === 'Cover Letter' || item.messageType === 'NEW') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item)}
                                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg pr-6">
              {selectedItem?.position || 'Loading...'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedItem?.company}
            </DialogDescription>
          </DialogHeader>

          {loadingItem ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-slate-400" />
            </div>
          ) : selectedItem ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Status Update Section */}
              {selectedItem.status && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600">
                  <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Status:</Label>
                  <Select
                    value={selectedItem.status}
                    onValueChange={(newStatus) => {
                      handleStatusChange(selectedItem, newStatus);
                      setSelectedItem({ ...selectedItem, status: newStatus });
                    }}
                  >
                    <SelectTrigger className={`h-8 sm:h-9 w-full sm:w-[150px] text-xs sm:text-sm ${STATUS_CONFIG[selectedItem.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="DRAFT" className="rounded-md text-xs sm:text-sm">Draft</SelectItem>
                      <SelectItem value="SENT" className="rounded-md text-xs sm:text-sm">Sent</SelectItem>
                      <SelectItem value="DONE" className="rounded-md text-xs sm:text-sm">Done</SelectItem>
                      <SelectItem value="GHOST" className="rounded-md text-xs sm:text-sm">No Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}


              {selectedItem.content && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">Content</h3>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedItem.content}
                    </p>
                  </div>
                </div>
              )}

              {selectedItem.subject && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">Subject</h3>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300">
                      {selectedItem.subject}
                    </p>
                  </div>
                </div>
              )}

              {selectedItem.body && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">Body</h3>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedItem.body}
                    </p>
                  </div>
                </div>
              )}

              {selectedItem.message && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">Message</h3>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedItem.message}
                    </p>
                  </div>
                </div>
              )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-gray-700">
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400">
                  <span className="font-semibold">Created:</span> {selectedItem.createdAt && new Date(selectedItem.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {selectedItem.llmModel && (
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400">
                    <span className="font-semibold">AI Model:</span> {getModelDisplayName(selectedItem.llmModel)}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const content = selectedItem.content || selectedItem.message || selectedItem.body || '';
                    navigator.clipboard.writeText(content);
                    toast({ title: 'Success', description: 'Content copied to clipboard!' });
                  }}
                  className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
