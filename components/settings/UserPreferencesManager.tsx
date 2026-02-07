'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Loader2, Save, Link } from 'lucide-react';

interface Preferences {
  defaultLlmModel: string;
  defaultLength: string;
  autoSave: boolean;
  defaultStatus: string;
  followupReminderDays: number;
  resumeLink: string;
}

export default function UserPreferencesManager() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Preferences>({
    defaultLlmModel: '',
    defaultLength: 'MEDIUM',
    autoSave: true,
    defaultStatus: 'SENT',
    followupReminderDays: 7,
    resumeLink: '',
  });

  // Use shared hooks
  const { models: availableModels, isLoading: loadingModels } = useAvailableModels();
  const { preferences, isLoading: loadingPreferences, invalidatePreferences } = useUserPreferences();

  // Sync preferences from server to local state
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        ...preferences,
        defaultLlmModel: preferences.defaultLlmModel || '',
        defaultLength: preferences.defaultLength || 'MEDIUM',
        autoSave: true,
        defaultStatus: preferences.defaultStatus || 'SENT',
        followupReminderDays: 7,
        resumeLink: preferences.resumeLink || '',
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPreferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      toast({
        title: 'Success',
        description: 'Preferences saved successfully!',
      });

      // Invalidate cache to refresh preferences
      invalidatePreferences();
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

  if (loadingPreferences || loadingModels) {
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
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100">Default Settings</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Set your default preferences for content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Default AI Model</Label>
            <Select
              value={localPreferences.defaultLlmModel}
              onValueChange={(value) =>
                setLocalPreferences((prev) => ({ ...prev, defaultLlmModel: value }))
              }
              disabled={availableModels.length === 0}
            >
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                <SelectValue placeholder={availableModels.length === 0 ? "No models available - Add API keys first" : "Select a model"} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No models available - Add API keys in the API Keys tab
                  </SelectItem>
                ) : (
                  availableModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
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
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {availableModels.length === 0
                ? "Add API keys in the API Keys tab to see available models"
                : "This model will be selected by default in all generators"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Default Content Length</Label>
            <Select
              value={localPreferences.defaultLength}
              onValueChange={(value) =>
                setLocalPreferences((prev) => ({ ...prev, defaultLength: value }))
              }
            >
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONCISE">Concise</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LONG">Long</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default length for generated content
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Default Status</Label>
            <Select
              value={localPreferences.defaultStatus}
              onValueChange={(value) =>
                setLocalPreferences((prev) => ({ ...prev, defaultStatus: value }))
              }
            >
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default status when saving generated content
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100 flex items-center gap-2">
            <Link className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            Public Resume Link
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Add a link to your public resume (Google Drive, Dropbox, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Resume URL</Label>
            <Input
              placeholder="https://drive.google.com/file/d/..."
              value={localPreferences.resumeLink}
              onChange={(e) =>
                setLocalPreferences((prev) => ({ ...prev, resumeLink: e.target.value }))
              }
              className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground">
              This link will be shared with the AI when generating messages, enabling it to reference your publicly hosted resume
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100">Behavior Settings</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Configure how the application behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Auto-save Generated Content</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Automatically save generated content to history
              </p>
            </div>
            <Switch
              checked={localPreferences.autoSave}
              onCheckedChange={(checked) =>
                setLocalPreferences((prev) => ({ ...prev, autoSave: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Follow-up Reminder Days</Label>
            <Select
              value={localPreferences.followupReminderDays.toString()}
              onValueChange={(value) =>
                setLocalPreferences((prev) => ({ ...prev, followupReminderDays: parseInt(value) }))
              }
            >
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="5">5 days</SelectItem>
                <SelectItem value="7">7 days (recommended)</SelectItem>
                <SelectItem value="10">10 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be reminded to follow up on LinkedIn/Email messages after this many days
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full h-10 sm:h-11 text-sm sm:text-base">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </>
        )}
      </Button>

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
          <strong>Note:</strong> These preferences will be applied as defaults across all generators.
          You can still override them for individual generations.
        </p>
      </div>
    </div>
  );
}
