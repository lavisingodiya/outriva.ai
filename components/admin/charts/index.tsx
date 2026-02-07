'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton } from './ChartSkeleton';

export const DailyActivityChart = dynamic(
  () => import('./AnalyticsCharts').then((mod) => mod.DailyActivityChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const ContentTypePieChart = dynamic(
  () => import('./AnalyticsCharts').then((mod) => mod.ContentTypePieChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const UserTypeBarChart = dynamic(
  () => import('./AnalyticsCharts').then((mod) => mod.UserTypeBarChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const ApiAdoptionBarChart = dynamic(
  () => import('./AnalyticsCharts').then((mod) => mod.ApiAdoptionBarChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export { ChartSkeleton };
