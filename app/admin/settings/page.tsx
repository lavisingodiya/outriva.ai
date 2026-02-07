'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Settings, ChevronLeft, Save, Loader2, Users, Crown, Shield, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { LiveClock } from '@/components/admin/LiveClock';

interface UsageLimit {
  id: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
  maxActivities: number;
  maxGenerations: number;
  maxFollowupGenerations: number;
  includeFollowups: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { limits: initialLimits, misuseMessage: initialMisuseMessage, isLoading, invalidateSettings } = useAdminSettings();
  const [limits, setLimits] = useState(initialLimits);
  const [saving, setSaving] = useState(false);
  const [misuseMessage, setMisuseMessage] = useState(initialMisuseMessage);
  const [savingMisuse, setSavingMisuse] = useState(false);

  // Sync local state with fetched data
  useEffect(() => {
    if (initialLimits.length > 0) {
      setLimits(initialLimits);
    }
  }, [initialLimits]);

  useEffect(() => {
    if (initialMisuseMessage) {
      setMisuseMessage(initialMisuseMessage);
    }
  }, [initialMisuseMessage]);

  const updateLimit = async (userType: string, maxActivities: number, maxGenerations: number, maxFollowupGenerations: number, includeFollowups: boolean) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType, maxActivities, maxGenerations, maxFollowupGenerations, includeFollowups }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: 'Success',
        description: 'Usage limit updated successfully',
      });

      invalidateSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update usage limit',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMaxActivitiesChange = (userType: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLimits(limits.map(limit =>
      limit.userType === userType
        ? { ...limit, maxActivities: numValue }
        : limit
    ));
  };

  const handleMaxGenerationsChange = (userType: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLimits(limits.map(limit =>
      limit.userType === userType
        ? { ...limit, maxGenerations: numValue }
        : limit
    ));
  };

  const handleMaxFollowupGenerationsChange = (userType: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLimits(limits.map(limit =>
      limit.userType === userType
        ? { ...limit, maxFollowupGenerations: numValue }
        : limit
    ));
  };

  const handleIncludeFollowupsChange = (userType: string, checked: boolean) => {
    setLimits(limits.map(limit =>
      limit.userType === userType
        ? { ...limit, includeFollowups: checked }
        : limit
    ));
  };

  const updateMisuseMessage = async () => {
    if (!misuseMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setSavingMisuse(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: misuseMessage }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: 'Success',
        description: 'Misuse message updated successfully',
      });

      invalidateSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update misuse message',
        variant: 'destructive',
      });
    } finally {
      setSavingMisuse(false);
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'FREE':
        return <Users className="w-5 h-5" />;
      case 'PLUS':
        return <Crown className="w-5 h-5" />;
      case 'ADMIN':
        return <Shield className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'FREE':
        return {
          bg: 'from-slate-50 to-gray-50',
          border: 'border-slate-200',
          icon: 'bg-slate-100 text-slate-600',
        };
      case 'PLUS':
        return {
          bg: 'from-purple-50 to-pink-50',
          border: 'border-purple-200',
          icon: 'bg-purple-100 text-purple-600',
        };
      case 'ADMIN':
        return {
          bg: 'from-red-50 to-orange-50',
          border: 'border-red-200',
          icon: 'bg-red-100 text-red-600',
        };
      default:
        return {
          bg: 'from-slate-50 to-gray-50',
          border: 'border-slate-200',
          icon: 'bg-slate-100 text-slate-600',
        };
    }
  };

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

  return (
    <AdminLayout>
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-8 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
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
                <h1 className="text-[42px] font-bold text-slate-900 leading-tight">Usage Limits</h1>
                <p className="text-lg text-slate-500">Configure activity limits for each user type</p>
              </div>
            </div>
          </motion.div>

      {/* Usage Limits Cards */}
      <div className="space-y-6">
        {limits.map((limit, index) => {
          const colors = getUserTypeColor(limit.userType);
          return (
            <motion.div
              key={limit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${colors.bg} border ${colors.border} shadow-sm overflow-hidden`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                        {getUserTypeIcon(limit.userType)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{limit.userType} Users</h3>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {limit.userType === 'FREE' && 'Free tier users with basic access'}
                          {limit.userType === 'PLUS' && 'Premium users with extended access'}
                          {limit.userType === 'ADMIN' && 'Administrators with unlimited access'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Max Activities */}
                    <div className="space-y-2">
                      <Label htmlFor={`max-${limit.userType}`} className="text-sm font-medium text-slate-900">
                        Maximum Monthly Activities (Saved Items)
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`max-${limit.userType}`}
                          type="number"
                          min="0"
                          value={limit.maxActivities}
                          onChange={(e) => handleMaxActivitiesChange(limit.userType, e.target.value)}
                          className="w-[200px] h-11 bg-white"
                          disabled={limit.userType === 'ADMIN'}
                        />
                        <span className="text-sm text-slate-600">
                          {limit.userType === 'ADMIN'
                            ? 'Unlimited activities'
                            : `${limit.maxActivities === 0 ? 'Unlimited' : limit.maxActivities} saved items per month`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Counts only when user clicks &quot;Save to History&quot;. Excludes follow-ups by default.
                      </p>
                    </div>

                    {/* Max Generations */}
                    <div className="space-y-2">
                      <Label htmlFor={`gen-${limit.userType}`} className="text-sm font-medium text-slate-900">
                        Maximum Monthly Generations (All Generations)
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`gen-${limit.userType}`}
                          type="number"
                          min="0"
                          value={limit.maxGenerations}
                          onChange={(e) => handleMaxGenerationsChange(limit.userType, e.target.value)}
                          className="w-[200px] h-11 bg-white"
                          disabled={limit.userType === 'ADMIN'}
                        />
                        <span className="text-sm text-slate-600">
                          {limit.userType === 'ADMIN'
                            ? 'Unlimited generations'
                            : `${limit.maxGenerations === 0 ? 'Unlimited' : limit.maxGenerations} generations per month`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Counts every successful generation (saved or not). Excludes follow-ups.
                      </p>
                    </div>

                    {/* Max Followup Generations */}
                    <div className="space-y-2">
                      <Label htmlFor={`followup-gen-${limit.userType}`} className="text-sm font-medium text-slate-900">
                        Maximum Monthly Follow-up Generations
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`followup-gen-${limit.userType}`}
                          type="number"
                          min="0"
                          value={limit.maxFollowupGenerations}
                          onChange={(e) => handleMaxFollowupGenerationsChange(limit.userType, e.target.value)}
                          className="w-[200px] h-11 bg-white"
                          disabled={limit.userType === 'ADMIN'}
                        />
                        <span className="text-sm text-slate-600">
                          {limit.userType === 'ADMIN'
                            ? 'Unlimited follow-ups'
                            : `${limit.maxFollowupGenerations === 0 ? 'Unlimited' : limit.maxFollowupGenerations} follow-up generations per month`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Separate limit for follow-up messages only. Prevents abuse while keeping follow-ups free.
                      </p>
                    </div>

                    {/* Include Follow-ups */}
                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-slate-200">
                      <div className="space-y-0.5">
                        <Label htmlFor={`followup-${limit.userType}`} className="text-sm font-medium text-slate-900">
                          Include Follow-up Messages in Activity Count
                        </Label>
                        <p className="text-xs text-slate-500">
                          When enabled, saved follow-up messages count towards activity limit (not recommended)
                        </p>
                      </div>
                      <Switch
                        id={`followup-${limit.userType}`}
                        checked={limit.includeFollowups}
                        onCheckedChange={(checked) => handleIncludeFollowupsChange(limit.userType, checked)}
                        disabled={limit.userType === 'ADMIN'}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <Button
                        onClick={() => updateLimit(limit.userType, limit.maxActivities, limit.maxGenerations, limit.maxFollowupGenerations, limit.includeFollowups)}
                        disabled={saving || limit.userType === 'ADMIN'}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="bg-blue-50 border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            About Usage Limits
          </h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>• <strong>Activities</strong> count only when user saves to history (follow-ups excluded by default)</li>
            <li>• <strong>Generations</strong> count every time AI generates content successfully (excludes follow-ups)</li>
            <li>• <strong>Follow-up Generations</strong> have their own separate limit to prevent abuse</li>
            <li>• <strong>Admin users</strong> always have unlimited access</li>
            <li>• <strong>Setting to 0</strong> grants unlimited for that metric</li>
            <li>• Limits reset monthly on the user&apos;s registration anniversary</li>
            <li>• Changes take effect immediately for all users of that type</li>
          </ul>
        </Card>
      </motion.div>

      {/* Misuse Detection Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <div className="mb-6">
          <h2 className="text-[32px] font-bold text-slate-900 leading-tight">Prompt Misuse Detection</h2>
          <p className="text-lg text-slate-500">Configure the message shown when non-job-related prompts are detected</p>
        </div>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-1">Custom Misuse Message</h3>
                <p className="text-sm text-slate-600">
                  This message is shown to users when the AI detects they&apos;re trying to use custom prompts for non-career purposes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="misuse-message" className="text-sm font-medium text-slate-900">
                  Message Text
                </Label>
                <Textarea
                  id="misuse-message"
                  value={misuseMessage}
                  onChange={(e) => setMisuseMessage(e.target.value)}
                  placeholder="Enter the message to show users..."
                  className="min-h-[120px] bg-white resize-none"
                />
                <p className="text-xs text-slate-500">
                  Use emojis and friendly language. This message prevents misuse while maintaining a positive user experience.
                </p>
              </div>

              <div className="bg-white/50 rounded-lg border border-red-200 p-4">
                <h4 className="text-sm font-medium text-slate-900 mb-2">Preview</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {misuseMessage || 'No message set'}
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-red-200">
                <Button
                  onClick={updateMisuseMessage}
                  disabled={savingMisuse || !misuseMessage.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {savingMisuse ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Misuse Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Info Card for Misuse Detection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 mb-8"
      >
        <Card className="bg-orange-50 border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-600" />
            How Misuse Detection Works
          </h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>• The system automatically detects when custom prompts are used for non-job/career purposes</li>
            <li>• Users attempting to generate essays, stories, or other non-career content will see this message</li>
            <li>• This protection is <strong>invisible to users</strong> - they won&apos;t see the security rules in their prompts</li>
            <li>• The message is <strong>configurable</strong> so you can adjust the tone and wording as needed</li>
            <li>• Detection happens instantly and prevents misuse while maintaining a friendly user experience</li>
          </ul>
        </Card>
      </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
