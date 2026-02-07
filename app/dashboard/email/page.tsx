'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ResizableTextarea } from '@/components/ui/resizable-textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useResumes } from '@/hooks/useResumes';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { Loader2, Copy, Mail, Sparkles, CheckCircle2, RefreshCw, Save, Trash2, Search } from 'lucide-react';

// Helper function for debouncing search
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface EmailSearchResult {
  id: string;
  companyName: string;
  positionTitle?: string;
  recipientName?: string;
  createdAt: string;
  status: string;
}

export default function EmailPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [messageType, setMessageType] = useState<'NEW' | 'FOLLOW_UP'>('NEW');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [areasOfInterest, setAreasOfInterest] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [length, setLength] = useState<'CONCISE' | 'MEDIUM' | 'LONG'>('MEDIUM');
  const [status, setStatus] = useState<'DRAFT' | 'SENT' | 'DONE' | 'GHOST'>('SENT');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [parentMessageId, setParentMessageId] = useState<string | null>(null);
  const [previousMessageSubject, setPreviousMessageSubject] = useState('');
  const [previousMessageBody, setPreviousMessageBody] = useState('');
  const [extraContent, setExtraContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestReferral, setRequestReferral] = useState(false);
  const [resumeAttachment, setResumeAttachment] = useState(true);
  const [recipientPosition, setRecipientPosition] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Debounce search query
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 400);

  // Use React Query for debounced search
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<EmailSearchResult[]>({
    queryKey: ['email-search', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      const response = await fetch(`/api/messages/search/email?q=${encodeURIComponent(debouncedSearchQuery)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.messages || [];
    },
    enabled: debouncedSearchQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Use shared hooks for data fetching
  const { resumes, isLoading: loadingResumes, getDefaultResume } = useResumes();
  const { models: availableModels, hasAnyKey: hasAnyApiKey, isLoading: loadingModels } = useAvailableModels();
  const { preferences } = useUserPreferences();

  // Load toggle preferences from localStorage on mount
  useEffect(() => {
    const savedRequestReferral = localStorage.getItem('email_requestReferral');
    const savedResumeAttachment = localStorage.getItem('email_resumeAttachment');

    if (savedRequestReferral !== null) {
      setRequestReferral(savedRequestReferral === 'true');
    }
    if (savedResumeAttachment !== null) {
      setResumeAttachment(savedResumeAttachment === 'true');
    }
  }, []);

  // Save toggle preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem('email_requestReferral', String(requestReferral));
  }, [requestReferral]);

  useEffect(() => {
    localStorage.setItem('email_resumeAttachment', String(resumeAttachment));
  }, [resumeAttachment]);

  useEffect(() => {
    // Check for followup parameters in URL
    const params = new URLSearchParams(window.location.search);
    const isFollowup = params.get('followup') === 'true';
    const messageId = params.get('id');

    // Set defaults from preferences if not in followup mode
    if (!isFollowup && preferences) {
      if (preferences.defaultLlmModel && !llmModel) {
        setLlmModel(preferences.defaultLlmModel);
      }
      if (preferences.defaultLength) {
        setLength(preferences.defaultLength);
      }
      if (preferences.defaultStatus) {
        setStatus(preferences.defaultStatus);
      }
    }

    // Set default resume
    const defaultResume = getDefaultResume();
    if (defaultResume && !selectedResumeId) {
      setSelectedResumeId(defaultResume.id);
    }

    if (isFollowup && messageId) {
      setMessageType('FOLLOW_UP');
      setParentMessageId(messageId);

      // Pre-fill form fields from URL params
      const positionTitleParam = params.get('positionTitle');
      const companyNameParam = params.get('companyName');
      const recipientEmailParam = params.get('recipientEmail');
      const recipientNameParam = params.get('recipientName');
      const jobDescriptionParam = params.get('jobDescription');
      const companyDescriptionParam = params.get('companyDescription');
      const resumeIdParam = params.get('resumeId');
      const lengthParam = params.get('length');
      const llmModelParam = params.get('llmModel');

      if (positionTitleParam) setPositionTitle(positionTitleParam);
      if (companyNameParam) setCompanyName(companyNameParam);
      if (recipientEmailParam) setRecipientEmail(recipientEmailParam);
      if (recipientNameParam) setRecipientName(recipientNameParam);
      if (jobDescriptionParam) setJobDescription(jobDescriptionParam);
      if (companyDescriptionParam) setCompanyDescription(companyDescriptionParam);
      if (resumeIdParam) setSelectedResumeId(resumeIdParam);
      if (lengthParam) setLength(lengthParam as 'CONCISE' | 'MEDIUM' | 'LONG');
      if (llmModelParam) setLlmModel(llmModelParam);

      // Fetch the previous email content
      fetch(`/api/history/email/${messageId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            setPreviousMessageSubject(data.message.subject || '');
            setPreviousMessageBody(data.message.body || '');
          }
        })
        .catch((error) => logger.error('Failed to load previous email', error));

      toast({
        title: 'Follow-up mode',
        description: 'Form pre-filled with previous email details',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences, resumes]);

  // Generate idempotency key when content is generated
  useEffect(() => {
    if (generatedSubject && generatedBody) {
      setIdempotencyKey(Date.now().toString());
    }
  }, [generatedSubject, generatedBody]);

  const loadMessageDetails = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/search/email?messageId=${encodeURIComponent(messageId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          const msg = data.message;
          setCompanyName(msg.companyName);
          setPositionTitle(msg.positionTitle || '');
          setRecipientName(msg.recipientName || '');
          setRecipientEmail(msg.recipientEmail || '');
          setJobDescription(msg.jobDescription || '');
          setCompanyDescription(msg.companyDescription || '');
          setAreasOfInterest(msg.areasOfInterest || '');
          if (msg.resumeId) setSelectedResumeId(msg.resumeId);
          if (msg.length) setLength(msg.length);
          if (msg.llmModel) setLlmModel(msg.llmModel);
          setParentMessageId(msg.id);
          setPreviousMessageSubject(msg.subject || '');
          setPreviousMessageBody(msg.body || '');
          setSearchQuery('');
          toast({
            title: 'Message Loaded',
            description: 'Previous email details loaded successfully',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load message details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load message details',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async () => {
    if (!recipientEmail || !companyName) {
      toast({ title: 'Error', description: 'Please fill in recipient email and company name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setSavedId(null); // Reset saved state
    setSavedMessageId(null);
    try {
      const response = await fetch('/api/generate/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          messageType,
          recipientEmail,
          recipientName: recipientName || undefined,
          recipientPosition: recipientPosition || undefined,
          positionTitle: positionTitle || undefined,
          areasOfInterest: areasOfInterest || undefined,
          companyName,
          jobDescription: jobDescription || undefined,
          companyDescription: companyDescription || undefined,
          parentMessageId: parentMessageId || undefined,
          extraContent: extraContent || undefined,
          length,
          llmModel,
          requestReferral,
          resumeAttachment,
          saveToHistory: false, // Don't auto-save
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to generate email');
      const data = await response.json();
      setGeneratedSubject(data.subject);
      setGeneratedBody(data.body);
      toast({ title: 'Success', description: 'Email generated successfully!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate email', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${generatedBody}`);
      toast({ title: 'Copied', description: 'Email copied to clipboard' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy to clipboard. Please try again.', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!generatedSubject || !generatedBody || !idempotencyKey) return;
    setSaving(true);
    try {
      const response = await fetch('/api/email-messages/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          subject: generatedSubject,
          body: generatedBody,
          messageType,
          resumeId: selectedResumeId || undefined,
          recipientEmail,
          recipientName: recipientName || undefined,
          recipientPosition: recipientPosition || undefined,
          positionTitle: positionTitle || undefined,
          areasOfInterest: areasOfInterest || undefined,
          companyName,
          jobDescription: jobDescription || undefined,
          companyDescription: companyDescription || undefined,
          parentMessageId: parentMessageId || undefined,
          length,
          llmModel,
          requestReferral,
          status,
        }),
      });
      if (!response.ok) throw new Error('Failed to save email');
      const data = await response.json();
      setSavedId(data.id);
      setSavedMessageId(data.messageId);
      toast({
        title: 'Saved',
        description: data.messageId ? `Email saved to history! Message ID: ${data.messageId}` : 'Email saved to history!'
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save email', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    if (!savedId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/history/email/${savedId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove email');
      setSavedId(null);
      toast({ title: 'Removed', description: 'Email removed from history' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove email', variant: 'destructive' });
    } finally {
      setSaving(false);
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
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-lg">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold text-slate-900 dark:text-gray-100 leading-tight">Professional Emails</h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-gray-400">
              Craft compelling job application emails that get responses from recruiters
            </p>
          </div>
        </div>
      </motion.div>

      {/* Message Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 sm:mb-6"
      >
        <Tabs value={messageType} onValueChange={(v: any) => setMessageType(v)}>
          <TabsList className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-1 sm:p-1.5 rounded-xl shadow-sm w-full sm:w-auto">
            <TabsTrigger
              value="NEW"
              className="rounded-lg px-4 sm:px-6 text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-700 data-[state=active]:to-gray-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 ease-in-out flex-1 sm:flex-none dark:data-[state=inactive]:text-gray-300"
            >
              New Email
            </TabsTrigger>
            <TabsTrigger
              value="FOLLOW_UP"
              className="rounded-lg px-4 sm:px-6 text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-700 data-[state=active]:to-gray-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 ease-in-out flex-1 sm:flex-none dark:data-[state=inactive]:text-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Follow-up
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Configuration Card */}
          <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-slate-50 to-gray-100/80 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-gray-400" />
                Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">Set your preferences</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={loadingResumes}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors">
                    <SelectValue placeholder={loadingResumes ? "Loading..." : "Choose a resume"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id} className="rounded-md">
                        {resume.title}
                      </SelectItem>
                    ))}
                    {resumes.length === 0 && (
                      <div className="px-2 py-4 sm:py-6 text-center">
                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">No resumes uploaded yet</p>
                        <Link href="/dashboard/settings?tab=resumes">
                          <button className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Upload Resume in Settings
                          </button>
                        </Link>
                      </div>
                    )}
                    {resumes.length > 0 && resumes.length < 3 && (
                      <Link href="/dashboard/settings?tab=resumes" className="block">
                        <div className="px-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer rounded-md border-t border-slate-100 dark:border-gray-700 mt-1">
                          + Add Another Resume ({resumes.length}/3)
                        </div>
                      </Link>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">AI Model</Label>
                <Select value={llmModel} onValueChange={setLlmModel} disabled={loadingModels || !hasAnyApiKey}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors">
                    <SelectValue placeholder={
                      loadingModels
                        ? "Loading models..."
                        : !hasAnyApiKey
                          ? "Please add API key first"
                          : "Select a model"
                    } />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {availableModels.length > 0 ? (
                      <>
                        {availableModels.map((model) => (
                          <SelectItem key={model.value} value={model.value} className="rounded-md">
                            <div className="flex items-center gap-2">
                              <span>{model.label}</span>
                              {model.isShared && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-green-600 font-medium">(Free)</span>
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded">
                                    Plus
                                  </span>
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        <Link href="/dashboard/settings?tab=api-keys" className="block">
                          <div className="px-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer rounded-md border-t border-slate-100 dark:border-gray-700 mt-1">
                            + Manage API Keys
                          </div>
                        </Link>
                      </>
                    ) : (
                      <div className="px-2 py-6 text-center">
                        <p className="text-sm text-slate-600 mb-3">No API keys configured</p>
                        <Link href="/dashboard/settings?tab=api-keys">
                          <button className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Add API Key in Settings
                          </button>
                        </Link>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {!hasAnyApiKey && !loadingModels && (
                  <p className="text-xs text-purple-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Add your API keys in Settings to enable AI generation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Email Length</Label>
                <Select value={length} onValueChange={(value: any) => setLength(value)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {[
                      ['CONCISE', 'Concise'],
                      ['MEDIUM', 'Medium'],
                      ['LONG', 'Detailed']
                    ].map(([v, l]) => (
                      <SelectItem key={v} value={v} className="rounded-md">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Search for Previous Messages - Only shown in follow-up mode */}
          {messageType === 'FOLLOW_UP' && (
            <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-purple-100/50 dark:border-purple-800/50 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  Search Previous Emails
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">Find and load a previous email to follow up on</p>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by company, position, message ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                  />
                  <Button
                    onClick={() => setSearchQuery('')}
                    disabled={!searchQuery.trim()}
                    className="h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => loadMessageDetails(msg.id)}
                        className="p-3 bg-slate-50 dark:bg-gray-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 rounded-lg cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">
                              {msg.companyName} {msg.positionTitle && `- ${msg.positionTitle}`}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                              {msg.recipientName && `To: ${msg.recipientName} • `}
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-300 rounded">
                              {msg.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !searchLoading && (
                  <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-4">No emails found</p>
                )}
              </div>
            </Card>
          )}


          {/* Email Details Card */}
          <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-slate-50 to-gray-100/80 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100">Email Details</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                {messageType === 'NEW' ? 'Enter recipient and position information' : 'Following up on your previous email'}
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">
                  Recipient Email <span className="text-slate-600 dark:text-gray-400">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="hiring@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Recipient Name</Label>
                <Input
                  placeholder="Jane Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Recipient Position</Label>
                <Input
                  placeholder="e.g., Hiring Manager, VP of Engineering"
                  value={recipientPosition}
                  onChange={(e) => setRecipientPosition(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                />
                <p className="text-xs text-slate-500 dark:text-gray-400">Optional: Their job title or position at the company</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">
                    Position
                  </Label>
                  <Input
                    placeholder="e.g., Senior Software Engineer (or leave blank for general inquiry)"
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">
                    Company <span className="text-slate-600 dark:text-gray-400">*</span>
                  </Label>
                  <Input
                    placeholder="Tech Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {messageType === 'NEW' && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100 leading-tight">Request Referral</span>
                      <div className="group relative flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                          Modify message to ask for a referral
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-1"></div>
                        </div>
                      </div>
                    </div>
                    <Switch checked={requestReferral} onCheckedChange={setRequestReferral} className="flex-shrink-0" />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100 leading-tight">Resume Attachment</span>
                    <div className="group relative flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                        Include statement about attaching your resume
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-1"></div>
                      </div>
                    </div>
                  </div>
                  <Switch checked={resumeAttachment} onCheckedChange={setResumeAttachment} className="flex-shrink-0" />
                </div>
              </div>

              {!positionTitle && (
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Areas of Interest</Label>
                  <Input
                    placeholder="e.g., Backend Development, Cloud Infrastructure, AI/ML"
                    value={areasOfInterest}
                    onChange={(e) => setAreasOfInterest(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-400">Specify areas you&apos;re interested in to help tailor the message</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {messageType === 'NEW' && (
                  <motion.div
                    key="new-email-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="space-y-4 sm:space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Job Description</Label>
                        <ResizableTextarea
                          placeholder="Paste the job description here..."
                          className="text-sm sm:text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors p-3"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          minHeight={80}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Company Info</Label>
                        <ResizableTextarea
                          placeholder="What interests you about this company?"
                          className="text-sm sm:text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors p-3"
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                          minHeight={60}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extra Content Field - Only shown in follow-up mode */}
              {messageType === 'FOLLOW_UP' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Extra Content</Label>
                    <ResizableTextarea
                      placeholder="Add any additional context or information to include in this follow-up email..."
                      className="text-sm sm:text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors p-3"
                      value={extraContent}
                      onChange={(e) => setExtraContent(e.target.value)}
                      minHeight={80}
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      This extra context will be used by the AI to enhance your follow-up email with new angles or information
                    </p>
                  </div>
                </motion.div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading || !recipientEmail || !companyName || !hasAnyApiKey || !llmModel}
                className="w-full h-11 sm:h-12 text-sm sm:text-base bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Generating email...</span>
                    <span className="sm:hidden">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Generate Email
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Output Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm h-full overflow-hidden">
            {generatedSubject && generatedBody ? (
              <>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/80 border-b border-emerald-100/50 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        Your Email
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        {savedId ? 'Saved to history' : 'Review and save if needed'}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Copy
                      </Button>
                      {savedId ? (
                        <Button
                          onClick={handleUnsave}
                          disabled={saving}
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          {saving ? <Loader2 className="mr-1 sm:mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 sm:mr-2 h-3 w-3" />}
                          Remove
                        </Button>
                      ) : (
                        <div className="flex gap-2 flex-1 sm:flex-none">
                          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                            <SelectTrigger className="h-8 sm:h-9 w-[80px] sm:w-[100px] text-xs sm:text-sm border-emerald-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SENT">Sent</SelectItem>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors h-8 sm:h-9 text-xs sm:text-sm"
                          >
                            {saving ? <Loader2 className="mr-1 sm:mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-1 sm:mr-2 h-3 w-3" />}
                            <span className="hidden sm:inline">Save to History</span>
                            <span className="sm:hidden">Save</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Subject Line</Label>
                    <Input
                      value={generatedSubject}
                      onChange={(e) => setGeneratedSubject(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Email Body</Label>
                    <Textarea
                      value={generatedBody}
                      onChange={(e) => setGeneratedBody(e.target.value)}
                      className="min-h-[400px] sm:min-h-[500px] lg:min-h-[580px] text-sm sm:text-base bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[500px] sm:min-h-[650px] lg:min-h-[780px]">
                {/* Previous Email Card - Only shown in follow-up mode when email is loaded */}
                {previousMessageBody && messageType === 'FOLLOW_UP' ? (
                  <div className="h-full flex flex-col">
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50/80 border-b border-amber-100/50 px-4 sm:px-6 py-3 sm:py-4">
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                        Previous Email
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">This is the email you sent previously</p>
                    </div>
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Subject</Label>
                        <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg p-2 sm:p-3">
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300">{previousMessageSubject}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">Body</Label>
                        <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{previousMessageBody}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 sm:p-12">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-[20px] bg-gradient-to-br from-slate-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                        <Mail className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-slate-600 dark:text-gray-400" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">Ready to Send</h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Fill in the required fields and click Generate Email to create your professional job application email
                      </p>
                      {savedMessageId && (
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-4 font-mono">
                          Last saved: {savedMessageId}
                        </p>
                      )}
                    </motion.div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
