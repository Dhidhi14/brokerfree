import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/auth-layout';
import { RegisterStepIndicator } from '@/components/auth/register-step-indicator';
import { RegisterStepAccount } from '@/components/auth/register-step-account';
import { RegisterStepOtp } from '@/components/auth/register-step-otp';
import { RegisterStepRole } from '@/components/auth/register-step-role';
import { getApiErrorMessage } from '@/lib/api-error';
import type { RegisterAccountValues } from '@/lib/auth-schemas';
import { useRegisterMutation } from '@/hooks/use-auth-mutations';
import { getDashboardPath } from '@/lib/role-routes';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

type WizardStep = 1 | 2 | 3;

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [step, setStep] = useState<WizardStep>(1);
  const [account, setAccount] = useState<RegisterAccountValues | null>(null);

  const registerMutation = useRegisterMutation();

  // Already completed signup — send to dashboard (do not use GuestRoute on /register)
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && user?.isPhoneVerified && step === 1 && !account) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isLoading, isAuthenticated, user, step, account, navigate]);

  // Resume OTP step if user registered but left before verifying (e.g. prior GuestRoute redirect)
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (
      isAuthenticated &&
      user &&
      !user.isPhoneVerified &&
      step === 1 &&
      !account
    ) {
      setAccount({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        password: '',
        confirmPassword: '',
      });
      setStep(2);
    }
  }, [isLoading, isAuthenticated, user, step, account]);

  const handleAccountSubmit = (values: RegisterAccountValues) => {
    setAccount(values);

    registerMutation.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: 'tenant',
      },
      {
        onSuccess: () => {
          setStep(2);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'Registration failed'));
        },
      }
    );
  };

  const subtitles: Record<WizardStep, string> = {
    1: 'Create your account to get started.',
    2: 'Verify your phone number.',
    3: 'Tell us how you want to use BrokerFree.',
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={subtitles[step]}
    >
      <RegisterStepIndicator currentStep={step} />

      <div
        key={step}
        className={cn('animate-slide-up')}
      >
        {step === 1 ? (
          <RegisterStepAccount
            defaultValues={account ?? undefined}
            onSubmit={handleAccountSubmit}
            isPending={registerMutation.isPending}
          />
        ) : null}

        {step === 2 && account ? (
          <RegisterStepOtp
            phone={account.phone}
            onEditPhone={() => setStep(1)}
            onVerified={() => setStep(3)}
          />
        ) : null}

        {step === 3 ? <RegisterStepRole /> : null}
      </div>

      {step === 1 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  );
}
