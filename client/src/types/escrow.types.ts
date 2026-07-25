export type EscrowStatus =
  | 'pending'
  | 'held'
  | 'released'
  | 'refunded'
  | 'disputed';

export interface EscrowStatusHistoryEntry {
  status: EscrowStatus;
  changedAt: string;
  changedBy?: string | null;
  note?: string;
}

export interface EscrowPropertySummary {
  _id: string;
  title: string;
  address?: {
    line1?: string;
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  rent?: number;
  deposit?: number;
}

export interface EscrowPartySummary {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

export interface EscrowAgreementSummary {
  _id: string;
  status: string;
  terms?: {
    rent?: number;
    deposit?: number;
    maintenance?: number;
  };
  pdfUrl?: string;
}

export interface Escrow {
  _id: string;
  agreement: string | EscrowAgreementSummary;
  property: string | EscrowPropertySummary;
  tenant: string | EscrowPartySummary;
  owner: string | EscrowPartySummary;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: EscrowStatus;
  statusHistory: EscrowStatusHistoryEntry[];
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutSuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutFailureResponse {
  error: {
    code: string;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayCheckoutSuccessResponse) => void;
  theme?: { color?: string };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (
    event: 'payment.failed',
    handler: (response: RazorpayCheckoutFailureResponse) => void
  ) => void;
}

export type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions
) => RazorpayInstance;
