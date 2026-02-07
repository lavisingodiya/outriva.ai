'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomPrompt {
  coverLetter?: string;
  linkedIn?: string;
  email?: string;
}

const PLACEHOLDER_TEXT = 'Default prompt is being used';

const DEFAULT_PROMPTS = {
  coverLetter: `You are an expert cover letter writer. Create a professional, compelling cover letter that:
- Highlights relevant experience and skills from the resume
- Shows genuine enthusiasm for the role and company
- Demonstrates understanding of the job requirements
- Uses a professional yet personable tone
- Includes specific examples where possible`,

  linkedIn: `You are an expert at writing LinkedIn outreach messages. Create a concise, professional message that:
- Is friendly and personable
- Shows genuine interest in the opportunity
- Highlights relevant qualifications briefly
- Includes a clear call to action
- Respects LinkedIn's character limits`,

  email: `You are an expert at writing professional job application emails. Create an email that:
- Has a clear, professional subject line
- Uses appropriate formal business email structure
- Highlights key qualifications concisely
- Shows enthusiasm for the opportunity
- Includes a professional closing`,
};

const fetchPrompts = async () => {
  const response = await fetch('/api/settings/prompts');
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
};

export default function CustomPromptsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [localPrompts, setLocalPrompts] = useState<CustomPrompt>({});

  // Use React Query for prompts
  const { data, isLoading } = useQuery({
    queryKey: ['custom-prompts'],
    queryFn: fetchPrompts,
    staleTime: 5 * 60 * 1000,
  });

  // Sync server data to local state
  useEffect(() => {
    if (data) {
      setLocalPrompts({
        coverLetter: data.coverLetter || '',
        linkedIn: data.linkedIn || '',
        email: data.email || '',
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPrompts),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save prompts');
      }

      toast({
        title: 'Success',
        description: 'Custom prompts saved successfully!',
      });

      // Invalidate cache to refresh prompts
      queryClient.invalidateQueries({ queryKey: ['custom-prompts'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (tab: keyof typeof DEFAULT_PROMPTS) => {
    setLocalPrompts((prev) => ({
      ...prev,
      [tab]: DEFAULT_PROMPTS[tab],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100">Custom Prompts</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Customize the AI prompts for each type of content generation. Leave blank to use default prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="coverLetter">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-white/50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
              <TabsTrigger value="coverLetter" className="text-xs sm:text-sm py-2 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-400">Cover Letter</TabsTrigger>
              <TabsTrigger value="linkedIn" className="text-xs sm:text-sm py-2 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-400">LinkedIn</TabsTrigger>
              <TabsTrigger value="email" className="text-xs sm:text-sm py-2 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-400">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="coverLetter" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-900 dark:text-gray-100">Cover Letter System Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset('coverLetter')}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={localPrompts.coverLetter || ''}
                  onChange={(e) =>
                    setLocalPrompts((prev) => ({ ...prev, coverLetter: e.target.value }))
                  }
                  placeholder={PLACEHOLDER_TEXT}
                  className="min-h-[200px] font-mono text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt guides how the AI generates cover letters. It will be used as the system prompt.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="linkedIn" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">LinkedIn System Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset('linkedIn')}
                    className="self-start text-xs sm:text-sm h-8"
                  >
                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={localPrompts.linkedIn || ''}
                  onChange={(e) =>
                    setLocalPrompts((prev) => ({ ...prev, linkedIn: e.target.value }))
                  }
                  placeholder={PLACEHOLDER_TEXT}
                  className="min-h-[150px] sm:min-h-[200px] font-mono text-xs sm:text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt guides how the AI generates LinkedIn messages. Keep it concise for shorter outputs.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Email System Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset('email')}
                    className="self-start text-xs sm:text-sm h-8"
                  >
                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={localPrompts.email || ''}
                  onChange={(e) =>
                    setLocalPrompts((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={PLACEHOLDER_TEXT}
                  className="min-h-[150px] sm:min-h-[200px] font-mono text-xs sm:text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt guides how the AI generates email messages including subject lines.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 sm:mt-6">
            <Button onClick={handleSave} disabled={saving} className="w-full h-10 sm:h-11 text-sm sm:text-base">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Custom Prompts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
          <strong>Tip:</strong> Custom prompts override the default behavior. You can use placeholders like
          {' '}<code className="bg-blue-500/20 px-1 rounded">{'{{resume}}'}</code>,{' '}
          <code className="bg-blue-500/20 px-1 rounded">{'{{jobDescription}}'}</code>, and{' '}
          <code className="bg-blue-500/20 px-1 rounded">{'{{companyName}}'}</code> in your prompts.
        </p>
      </div>
    </div>
  );
}
