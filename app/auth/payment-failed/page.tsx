'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3] px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-br from-red-400 to-rose-500 p-4 rounded-full">
            <XCircle className="w-16 h-16 text-white" strokeWidth={2} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Payment Failed
        </h1>

        <p className="text-slate-600 mb-6">
          Unfortunately, your payment could not be processed. Please try again or contact support.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/auth/signup?plan=plus')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12 rounded-xl"
          >
            Try Again
          </Button>

          <Button
            onClick={() => router.push('/auth/signup')}
            variant="outline"
            className="w-full border-slate-300 text-slate-900 font-semibold h-12 rounded-xl hover:bg-slate-50"
          >
            Continue with Free Plan
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          If you continue to experience issues, please contact our support team.
        </p>
      </div>
    </div>
  );
}
