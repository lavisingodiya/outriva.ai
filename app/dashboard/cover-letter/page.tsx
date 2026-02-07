'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ResizableTextarea } from '@/components/ui/resizable-textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useResumes } from '@/hooks/useResumes';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Loader2, Copy, FileText, Sparkles, CheckCircle2, Save, Trash2 } from 'lucide-react';

export default function CoverLetterPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [length, setLength] = useState<'CONCISE' | 'MEDIUM' | 'LONG'>('MEDIUM');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Use shared hooks for data fetching
  const { resumes, isLoading: loadingResumes, getDefaultResume } = useResumes();
  const { models: availableModels, hasAnyKey: hasAnyApiKey, isLoading: loadingModels } = useAvailableModels();
  const { preferences } = useUserPreferences();

  // Set defaults from preferences and resumes
  useEffect(() => {
    const defaultResume = getDefaultResume();
    if (defaultResume && !selectedResumeId) {
      setSelectedResumeId(defaultResume.id);
    }
  }, [resumes, selectedResumeId, getDefaultResume]);

  useEffect(() => {
    if (preferences) {
      if (preferences.defaultLlmModel && !llmModel) {
        setLlmModel(preferences.defaultLlmModel);
      }
      if (preferences.defaultLength) {
        setLength(preferences.defaultLength);
      }
    }
  }, [preferences, llmModel]);

  // Generate idempotency key when content is generated
  useEffect(() => {
    if (generatedLetter) {
      setIdempotencyKey(Date.now().toString());
    }
  }, [generatedLetter]);

  const handleGenerate = async () => {
    if (!jobDescription) {
      toast({
        title: 'Error',
        description: 'Please enter a job description',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSavedId(null); // Reset saved state
    try {
      const response = await fetch('/api/generate/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          jobDescription,
          companyDescription: companyDescription || undefined,
          positionTitle: positionTitle || undefined,
          companyName: companyName || undefined,
          length,
          llmModel,
          saveToHistory: false, // Don't auto-save
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setGeneratedLetter(data.content);

      toast({
        title: 'Success',
        description: 'Cover letter generated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate cover letter',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedLetter || !idempotencyKey) return;

    setSaving(true);
    try {
      const response = await fetch('/api/cover-letters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          content: generatedLetter,
          resumeId: selectedResumeId || undefined,
          jobDescription,
          companyDescription: companyDescription || undefined,
          positionTitle: positionTitle || undefined,
          companyName: companyName || undefined,
          length,
          llmModel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save cover letter');
      }

      const data = await response.json();
      setSavedId(data.id);

      toast({
        title: 'Saved',
        description: 'Cover letter saved to history!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save cover letter',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    if (!savedId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/history/cover-letter/${savedId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from history');
      }

      setSavedId(null);

      toast({
        title: 'Removed',
        description: 'Cover letter removed from history',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove from history',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      toast({
        title: 'Copied',
        description: 'Cover letter copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[42px] font-bold text-slate-900 dark:text-gray-100 leading-tight">Cover Letters</h1>
            <p className="text-lg text-slate-500 dark:text-gray-400">
              Craft compelling, personalized cover letters that showcase your perfect fit
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Configuration Card */}
          <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100/50 dark:border-amber-800/50 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">Set your preferences</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={loadingResumes}>
                  <SelectTrigger className="h-10 sm:h-11 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base">
                    <SelectValue placeholder={loadingResumes ? "Loading..." : "Choose a resume"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id} className="rounded-md text-sm">
                        {resume.title}
                      </SelectItem>
                    ))}
                    {resumes.length === 0 && (
                      <div className="px-2 py-4 sm:py-6 text-center">
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mb-3">No resumes uploaded yet</p>
                        <Link href="/dashboard/settings?tab=resumes">
                          <button className="w-full px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Upload Resume in Settings
                          </button>
                        </Link>
                      </div>
                    )}
                    {resumes.length > 0 && resumes.length < 3 && (
                      <Link href="/dashboard/settings?tab=resumes" className="block">
                        <div className="px-2 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer rounded-md border-t border-slate-100 dark:border-gray-700 mt-1">
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
                  <SelectTrigger className="h-10 sm:h-11 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base">
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
                          <SelectItem key={model.value} value={model.value} className="rounded-md text-sm">
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
                          <div className="px-2 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer rounded-md border-t border-slate-100 dark:border-gray-700 mt-1">
                            + Manage API Keys
                          </div>
                        </Link>
                      </>
                    ) : (
                      <div className="px-2 py-4 sm:py-6 text-center">
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mb-3">No API keys configured</p>
                        <Link href="/dashboard/settings?tab=api-keys">
                          <button className="w-full px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Add API Key in Settings
                          </button>
                        </Link>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {!hasAnyApiKey && !loadingModels && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Add your API keys in Settings to enable AI generation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Length</Label>
                <Select value={length} onValueChange={(value: any) => setLength(value)}>
                  <SelectTrigger className="h-10 sm:h-11 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {[
                      ['CONCISE', 'Concise (~250 words)'],
                      ['MEDIUM', 'Medium (~400 words)'],
                      ['LONG', 'Detailed (~600 words)']
                    ].map(([v, l]) => (
                      <SelectItem key={v} value={v} className="rounded-md text-sm">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Job Details Card */}
          <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100/50 dark:border-amber-800/50 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100">Job Details</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">Tell us about the position</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Position</Label>
                  <Input
                    placeholder="Software Engineer"
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    className="h-10 sm:h-11 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Company</Label>
                  <Input
                    placeholder="Tech Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-10 sm:h-11 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">
                  Job Description <span className="text-amber-600 dark:text-amber-400">*</span>
                </Label>
                <ResizableTextarea
                  placeholder="Paste the full job description here..."
                  className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg leading-relaxed hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base p-3"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  minHeight={150}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-900 dark:text-gray-100">Company Info (Optional)</Label>
                <ResizableTextarea
                  placeholder="What interests you about this company?"
                  className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg hover:border-slate-300 dark:hover:border-gray-500 transition-colors text-sm sm:text-base p-3"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  minHeight={80}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !jobDescription || !hasAnyApiKey || !llmModel}
                className="w-full h-11 sm:h-12 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating your cover letter...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Cover Letter
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
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 shadow-sm h-full overflow-hidden">
            {generatedLetter ? (
              <>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-100/50 dark:border-emerald-800/50 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                        Your Cover Letter
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                        {savedId ? 'Saved to history' : 'Review and save to history if needed'}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        <Copy className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Copy
                      </Button>
                      {savedId ? (
                        <Button
                          onClick={handleUnsave}
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          {saving ? (
                            <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                          Remove
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSave}
                          size="sm"
                          disabled={saving}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          {saving ? (
                            <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                          Save to History
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <Textarea
                    value={generatedLetter}
                    onChange={(e) => setGeneratedLetter(e.target.value)}
                    className="min-h-[500px] sm:min-h-[680px] bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-lg resize-none leading-relaxed font-serif text-sm sm:text-[15px]"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] sm:min-h-[600px] lg:min-h-[780px] p-6 sm:p-12">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">Ready to Create</h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Fill in the job details and click Generate to craft your personalized cover letter
                  </p>
                </motion.div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
