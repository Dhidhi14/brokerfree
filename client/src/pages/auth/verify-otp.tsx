import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/auth-layout';
import { OtpInput } from '@/components/forms/otp-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from '@/hooks/use-auth-mutations';

const RESEND_COOLDOWN_SEC = 30;

interface VerifyOtpLocationState {
  phone?: string;
}

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as VerifyOtpLocationState | null;

  const [phone, setPhone] = useState(state?.phone ?? '');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const sendOtp = useSendOtpMutation();
  const verifyOtp = useVerifyOtpMutation();
  const initialSendDone = useRef(false);

  const sendOtpRequest = (showToast = true) => {
    if (phone.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }

    sendOtp.mutate(phone, {
      onSuccess: () => {
        if (showToast) {
          toast.success('OTP sent');
        }
        setCooldown(RESEND_COOLDOWN_SEC);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Failed to send OTP'));
      },
    });
  };

  useEffect(() => {
    if (!phone || phone.length !== 10 || initialSendDone.current) {
      return;
    }
    initialSendDone.current = true;
    sendOtpRequest(false);
  }, [phone]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = () => {
    if (phone.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    verifyOtp.mutate(
      { phone, otp },
      {
        onSuccess: () => {
          toast.success('Phone verified');
          navigate('/login', { replace: true });
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'Invalid OTP'));
        },
      }
    );
  };

  return (
    <AuthLayout
      title="Verify your phone"
      subtitle="Enter the code we sent to your mobile number."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="phone"
              className="rounded-l-none"
              placeholder="9876543210"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                initialSendDone.current = false;
              }}
            />
          </div>
        </div>

        <p className="rounded-lg border border-dashed border-primary/30 bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
          Demo mode: check your <strong className="text-foreground">server terminal</strong> for
          the OTP code.
        </p>

        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={verifyOtp.isPending}
        />

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full brand-gradient text-primary-foreground hover:opacity-90"
            onClick={handleVerify}
            disabled={verifyOtp.isPending}
          >
            {verifyOtp.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Verifying…
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={cooldown > 0 || sendOtp.isPending}
            onClick={() => sendOtpRequest(true)}
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
