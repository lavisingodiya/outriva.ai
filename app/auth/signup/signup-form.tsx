'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const isPlusFlow = searchParams.get('plan') === 'plus';

  const validatePassword = (): boolean => {
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }

    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      toast({
        title: 'Error',
        description: 'Password must contain at least one uppercase letter',
        variant: 'destructive',
      });
      return false;
    }

    if (!/[a-z]/.test(password)) {
      toast({
        title: 'Error',
        description: 'Password must contain at least one lowercase letter',
        variant: 'destructive',
      });
      return false;
    }

    if (!/[0-9]/.test(password)) {
      toast({
        title: 'Error',
        description: 'Password must contain at least one number',
        variant: 'destructive',
      });
      return false;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      toast({
        title: 'Error',
        description: 'Password must contain at least one special character',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setLoading(true);

    try {
      // If PLUS flow, create Supabase user first, then go to payment
      if (isPlusFlow) {
        setProcessingPayment(true);
        console.log('Starting PLUS payment flow for email:', email);

        // Step 1: Create Supabase auth user (sends verification email)
        const supabase = createClient();
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signupError) {
          throw new Error(signupError.message || 'Failed to create account');
        }

        console.log('Supabase user created, verification email sent');

        // Step 2: Create Coinbase charge for payment
        const chargeResponse = await fetch('/api/payment/create-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        console.log('Charge API response status:', chargeResponse.status);

        if (!chargeResponse.ok) {
          const errorData = await chargeResponse.json();
          throw new Error(errorData.message || 'Failed to create payment charge');
        }

        const chargeData = await chargeResponse.json();
        console.log('Charge created:', chargeData);

        if (!chargeData.url) {
          throw new Error('No payment URL received from server');
        }

        console.log('Redirecting to Coinbase:', chargeData.url);
        window.location.href = chargeData.url; // Redirect to Coinbase hosted payment page
        return;
      }

      // FREE flow - normal signup
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  return (
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
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Create Account</h2>
              <p className="text-slate-600">
                {isPlusFlow
                  ? 'Sign up and upgrade to Plus ($5/month)'
                  : 'Sign up to start using AI Job Master'}
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-white border-slate-200 rounded-[16px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-white border-slate-200 rounded-[16px]"
                />
                <p className="text-xs text-slate-500">
                  Must include: 8+ characters, uppercase, lowercase, number, special character
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-white border-slate-200 rounded-[16px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-[20px] transition-colors mt-6"
                disabled={loading || processingPayment}
              >
                {processingPayment
                  ? 'Redirecting to payment...'
                  : loading
                  ? 'Creating account...'
                  : isPlusFlow
                  ? 'Continue to Payment'
                  : 'Create Account'}
              </Button>
            </form>

            <p className="text-sm text-center text-slate-600 mt-6">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-slate-900 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
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
  );
}
