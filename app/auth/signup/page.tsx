import { Suspense } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="w-full max-w-md text-center py-12">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
