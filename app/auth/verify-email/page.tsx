'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/AuthLayout';
import { Sparkles, Mail, CheckCircle } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">AI Job Master</h1>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                Check your email
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                We&apos;ve sent a verification link to<br />
                <span className="font-semibold text-slate-900">{email}</span>
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left text-sm text-slate-700">
                    <p className="font-semibold mb-1">Next steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open your email inbox</li>
                      <li>Click the verification link</li>
                      <li>You&apos;ll be redirected to login</li>
                    </ol>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button className="text-slate-900 font-medium hover:underline">
                  resend verification
                </button>
              </p>

              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="w-full h-12 border-slate-300 hover:bg-slate-50 rounded-[20px]"
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-6"
        >
          <Link
            href="/"
            className="text-slate-700 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
