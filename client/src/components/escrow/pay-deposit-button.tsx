import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useCreateEscrowOrderMutation,
  useVerifyPaymentMutation,
} from '@/hooks/use-escrow';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { EscrowOrder } from '@/types/escrow.types';

interface PayDepositButtonProps {
  agreementId: string;
  className?: string;
}

interface OpenCheckoutCallbacks {
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (description: string) => void;
  onDismiss: () => void;
}

function openRazorpayCheckout(
  order: EscrowOrder,
  prefill: { name?: string; email?: string; contact?: string },
  { onSuccess, onFailure, onDismiss }: OpenCheckoutCallbacks
): void {
  if (typeof window.Razorpay !== 'function') {
    onFailure('Payment checkout failed to load. Please refresh and try again.');
    return;
  }

  // Razorpay Checkout expects amount in paise; API returns rupees
  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: Math.round(order.amount * 100),
    currency: order.currency,
    order_id: order.orderId,
    name: 'BrokerFree',
    description: 'Security Deposit',
    prefill,
    theme: { color: '#7c3aed' },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  });

  rzp.on('payment.failed', (response) => {
    onFailure(response.error.description || 'Payment failed. Please try again.');
  });

  rzp.open();
}

export function PayDepositButton({ agreementId, className }: PayDepositButtonProps) {
  const user = useAuthStore((state) => state.user);
  const createOrder = useCreateEscrowOrderMutation();
  const verifyPayment = useVerifyPaymentMutation();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const isBusy = createOrder.isPending || verifyPayment.isPending || isCheckoutOpen;

  const handlePay = () => {
    createOrder.mutate(agreementId, {
      onSuccess: (order) => {
        setIsCheckoutOpen(true);
        openRazorpayCheckout(
          order,
          {
            name: user?.fullName,
            email: user?.email,
            contact: user?.phone,
          },
          {
            onSuccess: (response) => {
              verifyPayment.mutate(response, {
                onSuccess: () => {
                  setIsCheckoutOpen(false);
                  toast.success('Deposit paid — held safely in BrokerFree escrow');
                },
                onError: (err) => {
                  setIsCheckoutOpen(false);
                  toast.error(getApiErrorMessage(err, 'Payment verification failed'));
                },
              });
            },
            onFailure: (description) => {
              setIsCheckoutOpen(false);
              toast.error(description);
            },
            onDismiss: () => {
              setIsCheckoutOpen(false);
            },
          }
        );
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Failed to start payment'));
      },
    });
  };

  return (
    <Button
      type="button"
      className={cn(
        'brand-gradient text-primary-foreground hover:opacity-90',
        className
      )}
      onClick={handlePay}
      disabled={isBusy}
    >
      {isBusy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {verifyPayment.isPending ? 'Verifying…' : 'Opening checkout…'}
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Pay Deposit
        </>
      )}
    </Button>
  );
}
