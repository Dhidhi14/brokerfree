import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { OtpInput } from '@/components/forms/otp-input';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from '@/hooks/use-auth-mutations';

const RESEND_COOLDOWN_SEC = 30;

interface RegisterStepOtpProps {
  phone: string;
  onEditPhone: () => void;
  onVerified: () => void;
}

export function RegisterStepOtp({ phone, onEditPhone, onVerified }: RegisterStepOtpProps) {
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const sendOtp = useSendOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const initialSendDone = useRef(false);

  const sendOtpRequest = (showToast = true) => {
    sendOtp.mutate(phone, {
      onSuccess: () => {
        if (showToast) {
          toast.success('OTP sent to your phone');
        }
        setCooldown(RESEND_COOLDOWN_SEC);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Failed to send OTP'));
      },
    });
  };

  useEffect(() => {
    if (initialSendDone.current) {
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
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    verifyOtp.mutate(
      { phone, otp },
      {
        onSuccess: () => {
          toast.success('Phone verified');
          onVerified();
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'Invalid OTP'));
        },
      }
    );
  };

  const formattedPhone = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        We sent a code to{' '}
        <span className="font-medium text-foreground">{formattedPhone}</span>.{' '}
        <button
          type="button"
          onClick={onEditPhone}
          className="font-medium text-primary hover:underline"
        >
          Edit
        </button>
      </p>

      <p className="rounded-lg border border-dashed border-primary/30 bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
        Demo mode: check your <strong className="text-foreground">server terminal</strong> for
        the OTP code.
      </p>

      <OtpInput
        value={otp}
        onChange={setOtp}
        onComplete={setOtp}
        disabled={verifyOtp.isPending}
      />

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          className="w-full brand-gradient text-primary-foreground hover:opacity-90"
          onClick={handleVerify}
          disabled={verifyOtp.isPending || otp.length !== 6}
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
          {sendOtp.isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Sending…
            </>
          ) : cooldown > 0 ? (
            `Resend OTP in ${cooldown}s`
          ) : (
            'Resend OTP'
          )}
        </Button>
      </div>
    </div>
  );
}
