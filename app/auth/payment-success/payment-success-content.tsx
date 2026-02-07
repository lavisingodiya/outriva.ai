'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'verifying' | 'verified' | 'error'>('verifying');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      router.push('/auth/signup');
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 15; // Poll for up to 15 seconds (1 second per poll)

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/auth/check-plus-status?email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error('Failed to check status');

        const data = await response.json();

        if (!isMounted) return;

        if (data.isPLUS) {
          setStatus('verified');
          // Wait a moment then redirect
          setTimeout(() => {
            if (isMounted) {
              router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
            }
          }, 1500);
        } else {
          pollCount++;
          if (pollCount < maxPolls) {
            // Poll again after 1 second
            setTimeout(checkPaymentStatus, 1000);
          } else {
            setStatus('error');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (isMounted) {
          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(checkPaymentStatus, 1000);
          } else {
            setStatus('error');
          }
        }
      }
    };

    checkPaymentStatus();

    return () => {
      isMounted = false;
    };
  }, [email, router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3] px-4">
        <div className="text-center max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-4 rounded-full">
              <div className="w-16 h-16 rounded-full border-4 border-white border-t-transparent animate-spin" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Processing Payment
          </h1>

          <p className="text-slate-600 mb-6">
            We&apos;re confirming your payment with our payment processor.
          </p>

          <p className="text-sm text-slate-500 mb-8">
            This usually takes a few seconds...
          </p>

          <div className="mt-8 flex gap-3 justify-center">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3] px-4">
        <div className="text-center max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-red-400 to-red-500 p-4 rounded-full">
              <div className="w-16 h-16 text-white text-4xl flex items-center justify-center">!</div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Processing Timeout
          </h1>

          <p className="text-slate-600 mb-6">
            We&apos;re taking longer than expected to confirm your payment. Don&apos;t worry, your payment is being processed.
          </p>

          <p className="text-sm text-slate-500 mb-8">
            Check your email for a confirmation, or contact support if you don&apos;t receive one within 24 hours.
          </p>

          <button
            onClick={() => router.push(`/auth/verify-email?email=${encodeURIComponent(email || '')}`)}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Verification
          </button>
        </div>
      </div>
    );
  }

  // status === 'verified'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3] px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-full">
            <CheckCircle className="w-16 h-16 text-white" strokeWidth={2} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Payment Successful!
        </h1>

        <p className="text-slate-600 mb-6">
          Thank you for upgrading to AI Job Master Plus. Your account has been activated.
        </p>

        <p className="text-sm text-slate-500 mb-8">
          We&apos;re sending a verification email to <strong>{email}</strong>
        </p>

        <p className="text-xs text-slate-400">
          Redirecting to email verification...
        </p>

        <div className="mt-8 flex gap-3 justify-center">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
