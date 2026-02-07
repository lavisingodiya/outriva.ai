'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Check, X } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ApiKeyStatus {
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
}

export default function ApiKeyManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Use React Query for API key status
  const { data: keyStatus, isLoading: loading } = useQuery<ApiKeyStatus>({
    queryKey: ['api-key-status'],
    queryFn: async () => {
      const response = await fetch('/api/settings/api-keys');
      if (!response.ok) throw new Error('Failed to load API key status');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const hasOpenaiKey = keyStatus?.hasOpenaiKey ?? false;
  const hasAnthropicKey = keyStatus?.hasAnthropicKey ?? false;
  const hasGeminiKey = keyStatus?.hasGeminiKey ?? false;

  const handleSave = async () => {
    // Check if any key is provided
    if (openaiKey === '' && anthropicKey === '' && geminiKey === '') {
      toast({
        title: 'No keys provided',
        description: 'Please enter at least one API key',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    setValidating(true);
    try {
      const payload: any = {};

      // Only include keys that were actually entered (non-empty)
      // Send empty string to remove a key
      if (openaiKey !== '') payload.openaiApiKey = openaiKey;
      if (anthropicKey !== '') payload.anthropicApiKey = anthropicKey;
      if (geminiKey !== '') payload.geminiApiKey = geminiKey;

      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save API keys');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'API keys validated and saved successfully! Available models have been fetched.',
      });

      // Invalidate cache to refresh API key status
      queryClient.invalidateQueries({ queryKey: ['api-key-status'] });
      queryClient.invalidateQueries({ queryKey: ['available-models'] });

      // Clear input fields
      setOpenaiKey('');
      setAnthropicKey('');
      setGeminiKey('');

    } catch (error: any) {
      logger.error('Failed to save API keys', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setValidating(false);
    }
  };

  const handleRemoveKey = async (provider: 'openai' | 'anthropic' | 'gemini') => {
    if (!confirm(`Are you sure you want to remove your ${provider} API key?`)) return;

    setSaving(true);
    try {
      const payload: any = {};
      if (provider === 'openai') payload.openaiApiKey = '';
      if (provider === 'anthropic') payload.anthropicApiKey = '';
      if (provider === 'gemini') payload.geminiApiKey = '';

      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove API key');
      }

      toast({
        title: 'Success',
        description: `${provider} API key removed successfully!`,
      });

      // Invalidate cache to refresh API key status
      queryClient.invalidateQueries({ queryKey: ['api-key-status'] });
      queryClient.invalidateQueries({ queryKey: ['available-models'] });

    } catch (error: any) {
      logger.error('Failed to remove API key', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100">API Keys</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Add your AI provider API keys. Keys are encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* OpenAI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="openai" className="text-sm sm:text-base text-slate-900 dark:text-gray-100">OpenAI API Key</Label>
              <div className="flex items-center gap-1 sm:gap-2">
                {hasOpenaiKey && (
                  <>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Configured</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKey('openai')}
                      disabled={saving}
                      className="h-6 px-1.5 sm:px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Input
              id="openai"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              disabled={saving}
              className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground">
              Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI Dashboard
              </a>
            </p>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="anthropic" className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Anthropic (Claude) API Key</Label>
              <div className="flex items-center gap-1 sm:gap-2">
                {hasAnthropicKey && (
                  <>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Configured</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKey('anthropic')}
                      disabled={saving}
                      className="h-6 px-1.5 sm:px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Input
              id="anthropic"
              type="password"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              disabled={saving}
              className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground">
              Get your key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Anthropic Console
              </a>
            </p>
          </div>

          {/* Gemini */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="gemini" className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Google Gemini API Key</Label>
              <div className="flex items-center gap-1 sm:gap-2">
                {hasGeminiKey && (
                  <>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Configured</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKey('gemini')}
                      disabled={saving}
                      className="h-6 px-1.5 sm:px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Input
              id="gemini"
              type="password"
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              disabled={saving}
              className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground">
              Get your key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-10 sm:h-11 text-sm sm:text-base">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {validating ? 'Validating & Saving...' : 'Saving...'}
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Save & Validate API Keys
              </>
            )}
          </Button>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              <strong>Security & Validation:</strong> Your API keys are validated by fetching available models before being encrypted with AES-256 and stored securely.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
