'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, FileText, MessageSquare, Settings as SettingsIcon, Lock } from 'lucide-react';
import {
  ApiKeyManager,
  ResumeManager,
  CustomPromptsManager,
  UserPreferencesManager,
  PasswordManager,
} from '@/components/settings';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('api-keys');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['api-keys', 'resumes', 'prompts', 'preferences', 'password'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[42px] font-bold text-slate-900 dark:text-gray-100 leading-tight">Settings</h1>
            <p className="text-sm sm:text-lg text-slate-500 dark:text-gray-400">
              Manage your API keys, resumes, custom prompts, and preferences
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-slate-200/60 dark:border-gray-700 p-1 rounded-xl grid grid-cols-5 w-full h-auto">
            <TabsTrigger
              value="api-keys"
              className="rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-slate-600 dark:text-gray-400 data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-gray-700/50"
            >
              <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">API Keys</span>
            </TabsTrigger>
            <TabsTrigger
              value="resumes"
              className="rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-slate-600 dark:text-gray-400 data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-gray-700/50"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Resumes</span>
            </TabsTrigger>
            <TabsTrigger
              value="prompts"
              className="rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-slate-600 dark:text-gray-400 data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-gray-700/50"
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Prompts</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-slate-600 dark:text-gray-400 data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-gray-700/50"
            >
              <SettingsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-slate-600 dark:text-gray-400 data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-gray-700/50"
            >
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Password</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ApiKeyManager />
            </motion.div>
          </TabsContent>

          <TabsContent value="resumes" className="space-y-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ResumeManager />
            </motion.div>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CustomPromptsManager />
            </motion.div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <UserPreferencesManager />
            </motion.div>
          </TabsContent>

          <TabsContent value="password" className="space-y-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PasswordManager />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-slate-900 dark:text-gray-100">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
