'use client';

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center bg-slate-50 rounded-lg animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading chart...</span>
      </div>
    </div>
  );
}
