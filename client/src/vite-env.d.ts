/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Razorpay: new (options: {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    theme?: { color?: string };
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    modal?: {
      ondismiss?: () => void;
    };
  }) => {
    open: () => void;
    on: (
      event: 'payment.failed',
      handler: (response: {
        error: {
          code: string;
          description: string;
        };
      }) => void
    ) => void;
  };
}
