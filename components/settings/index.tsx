'use client';

import dynamic from 'next/dynamic';

// Loading skeleton for settings components
function SettingsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 dark:border-gray-700 p-6">
        <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-slate-100 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-10 bg-slate-100 dark:bg-gray-700 rounded w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

// Dynamically import settings components - only load when tab is active
export const ApiKeyManager = dynamic(
  () => import('./ApiKeyManager'),
  { loading: () => <SettingsSkeleton /> }
);

export const ResumeManager = dynamic(
  () => import('./ResumeManager'),
  { loading: () => <SettingsSkeleton /> }
);

export const CustomPromptsManager = dynamic(
  () => import('./CustomPromptsManager'),
  { loading: () => <SettingsSkeleton /> }
);

export const UserPreferencesManager = dynamic(
  () => import('./UserPreferencesManager'),
  { loading: () => <SettingsSkeleton /> }
);

export const PasswordManager = dynamic(
  () => import('./PasswordManager'),
  { loading: () => <SettingsSkeleton /> }
);
