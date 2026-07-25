import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '@/config/env';
import { razorpay } from '@/config/razorpay';
import type { EscrowStatus } from '@/constants/escrow.constants';
import { Agreement } from '@/models/agreement.model';
import { AuditLog } from '@/models/audit-log.model';
import {
  Escrow,
  type EscrowDocument,
  type IEscrow,
} from '@/models/escrow.model';
import type { UserRole } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { logger } from '@/utils/logger';
import type { VerifyPaymentInput } from '@/validators/escrow.validator';

export interface EscrowOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

function refIdToString(value: unknown): string {
  if (value !== null && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

function appendStatusHistory(
  escrow: EscrowDocument,
  status: EscrowStatus,
  changedBy: string | null,
  note?: string
): void {
  escrow.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: changedBy ? new mongoose.Types.ObjectId(changedBy) : null,
    note,
  });
}

function timingSafeEqualHex(expected: string, received: string): boolean {
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(received, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return timingSafeEqualHex(expected, signature);
}

/**
 * Production: register a dedicated webhook secret in the Razorpay dashboard
 * and verify against that — not the API key secret. For MVP/local we follow
 * the task and use RAZORPAY_KEY_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(rawBody)
    .digest('hex');

  return timingSafeEqualHex(expected, signature);
}

async function findEscrowOrThrow(escrowId: string): Promise<EscrowDocument> {
  if (!mongoose.isValidObjectId(escrowId)) {
    throw new AppError('Escrow not found', 404, 'ESCROW_NOT_FOUND');
  }

  const escrow = await Escrow.findById(escrowId);

  if (!escrow) {
    throw new AppError('Escrow not found', 404, 'ESCROW_NOT_FOUND');
  }

  return escrow;
}

function assertParticipantOrAdmin(
  escrow: { tenant: unknown; owner: unknown },
  viewerId: string,
  viewerRole: UserRole
): void {
  if (viewerRole === 'admin') {
    return;
  }

  const isTenant = refIdToString(escrow.tenant) === viewerId;
  const isOwner = refIdToString(escrow.owner) === viewerId;

  if (!isTenant && !isOwner) {
    throw new AppError('Escrow not found', 404, 'ESCROW_NOT_FOUND');
  }
}

async function populateEscrow(escrowId: string): Promise<IEscrow> {
  const escrow = await Escrow.findById(escrowId)
    .populate({
      path: 'agreement',
      select: 'status terms pdfUrl',
    })
    .populate({
      path: 'property',
      select: 'title address rent deposit',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone email',
    })
    .populate({
      path: 'owner',
      select: 'fullName phone email',
    });

  if (!escrow) {
    throw new AppError('Escrow not found', 404, 'ESCROW_NOT_FOUND');
  }

  return escrow.toJSON() as IEscrow;
}

export async function createEscrowOrder(
  tenantId: string,
  agreementId: string
): Promise<EscrowOrderResult> {
  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  const agreement = await Agreement.findById(agreementId);

  if (!agreement) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  if (agreement.status !== 'executed') {
    throw new AppError(
      'Agreement must be executed before paying the security deposit',
      400,
      'AGREEMENT_NOT_EXECUTED'
    );
  }

  if (refIdToString(agreement.tenant) !== tenantId) {
    throw new AppError(
      'Only the tenant on this agreement can create an escrow order',
      403,
      'FORBIDDEN'
    );
  }

  const existing = await Escrow.findOne({ agreement: agreementId });

  if (existing) {
    if (existing.status !== 'pending') {
      throw new AppError(
        `Escrow already exists with status '${existing.status}'`,
        409,
        'ESCROW_ALREADY_EXISTS'
      );
    }

    return {
      orderId: existing.razorpayOrderId,
      amount: existing.amount,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  const amountRupees = agreement.terms.deposit;

  if (amountRupees < 1) {
    throw new AppError(
      'Agreement deposit must be at least ₹1',
      400,
      'INVALID_DEPOSIT_AMOUNT'
    );
  }

  const amountPaise = rupeesToPaise(amountRupees);

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: agreementId,
    });

    const orderId = String(order.id);

    const escrow = await Escrow.create({
      agreement: agreement._id,
      property: agreement.property,
      tenant: agreement.tenant,
      owner: agreement.owner,
      amount: amountRupees,
      razorpayOrderId: orderId,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date(),
          changedBy: new mongoose.Types.ObjectId(tenantId),
          note: 'Razorpay order created',
        },
      ],
    });

    logger.info('Escrow order created', {
      escrowId: escrow._id.toString(),
      agreementId,
      orderId,
      amountRupees,
    });

    return {
      orderId,
      amount: amountRupees,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    logger.error('Failed to create Razorpay order', { error, agreementId });
    throw new AppError(
      'Failed to create payment order',
      502,
      'RAZORPAY_ORDER_FAILED'
    );
  }
}

export async function verifyAndCapturePayment(
  tenantId: string,
  input: VerifyPaymentInput
): Promise<IEscrow> {
  const escrow = await Escrow.findOne({
    razorpayOrderId: input.razorpay_order_id,
  });

  if (!escrow) {
    throw new AppError('Escrow not found', 404, 'ESCROW_NOT_FOUND');
  }

  if (refIdToString(escrow.tenant) !== tenantId) {
    throw new AppError(
      'Only the tenant on this escrow can verify payment',
      403,
      'FORBIDDEN'
    );
  }

  if (escrow.status === 'held') {
    return populateEscrow(escrow._id.toString());
  }

  if (escrow.status !== 'pending') {
    throw new AppError(
      `Cannot verify payment for escrow in status '${escrow.status}'`,
      400,
      'INVALID_ESCROW_STATUS'
    );
  }

  const isValid = verifyCheckoutSignature(
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature
  );

  if (!isValid) {
    throw new AppError('Invalid payment signature', 400, 'INVALID_SIGNATURE');
  }

  escrow.razorpayPaymentId = input.razorpay_payment_id;
  escrow.status = 'held';
  appendStatusHistory(escrow, 'held', tenantId, 'Payment verified via Checkout');

  await escrow.save();

  logger.info('Escrow payment held', {
    escrowId: escrow._id.toString(),
    paymentId: input.razorpay_payment_id,
  });

  return populateEscrow(escrow._id.toString());
}

export async function getEscrowStatus(
  escrowId: string,
  viewerId: string,
  viewerRole: UserRole
): Promise<IEscrow> {
  const escrow = await findEscrowOrThrow(escrowId);
  assertParticipantOrAdmin(escrow, viewerId, viewerRole);
  return populateEscrow(escrowId);
}

async function populateEscrowList(
  filter: Record<string, unknown>
): Promise<IEscrow[]> {
  const escrows = await Escrow.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: 'agreement',
      select: 'status terms pdfUrl',
    })
    .populate({
      path: 'property',
      select: 'title address rent deposit',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone email',
    })
    .populate({
      path: 'owner',
      select: 'fullName phone email',
    });

  return escrows.map((doc) => doc.toJSON() as IEscrow);
}

export async function getMyEscrows(userId: string): Promise<IEscrow[]> {
  return populateEscrowList({
    $or: [{ tenant: userId }, { owner: userId }],
  });
}

/** Admin queue: deposits awaiting release/refund mediation */
export async function getAdminEscrows(): Promise<IEscrow[]> {
  return populateEscrowList({
    status: { $in: ['held', 'disputed'] },
  });
}

export async function releaseToOwner(
  adminId: string,
  escrowId: string,
  note?: string
): Promise<IEscrow> {
  const escrow = await findEscrowOrThrow(escrowId);

  if (escrow.status !== 'held') {
    throw new AppError(
      'Only held escrows can be released to the owner',
      400,
      'INVALID_ESCROW_STATUS'
    );
  }

  // Ledger/status transition only. A production payout to the owner's bank
  // account would call Razorpay Route / Payouts here; that integration is
  // out of scope for MVP — this marks the deposit as released on-platform.
  escrow.status = 'released';
  escrow.releasedAt = new Date();
  appendStatusHistory(escrow, 'released', adminId, note ?? 'Released to owner');

  await escrow.save();

  await AuditLog.create({
    action: 'escrow.released',
    performedBy: adminId,
    targetUser: escrow.owner,
    details: {
      escrowId: escrow._id.toString(),
      agreementId: escrow.agreement.toString(),
      amount: escrow.amount,
      note,
    },
  });

  logger.info('Escrow released to owner', {
    escrowId: escrow._id.toString(),
    adminId,
  });

  return populateEscrow(escrowId);
}

export async function refundToTenant(
  adminId: string,
  escrowId: string,
  note?: string
): Promise<IEscrow> {
  const escrow = await findEscrowOrThrow(escrowId);

  if (escrow.status !== 'held' && escrow.status !== 'disputed') {
    throw new AppError(
      'Only held or disputed escrows can be refunded',
      400,
      'INVALID_ESCROW_STATUS'
    );
  }

  if (!escrow.razorpayPaymentId) {
    throw new AppError(
      'Escrow has no captured payment to refund',
      400,
      'MISSING_PAYMENT_ID'
    );
  }

  const amountPaise = rupeesToPaise(escrow.amount);

  try {
    // Real Razorpay API call — in test mode refunds are simulated (safe/free)
    await razorpay.payments.refund(escrow.razorpayPaymentId, {
      amount: amountPaise,
    });
  } catch (error) {
    logger.error('Razorpay refund failed', {
      error,
      escrowId,
      paymentId: escrow.razorpayPaymentId,
    });
    throw new AppError('Failed to refund payment', 502, 'RAZORPAY_REFUND_FAILED');
  }

  escrow.status = 'refunded';
  escrow.refundedAt = new Date();
  appendStatusHistory(escrow, 'refunded', adminId, note ?? 'Refunded to tenant');

  await escrow.save();

  await AuditLog.create({
    action: 'escrow.refunded',
    performedBy: adminId,
    targetUser: escrow.tenant,
    details: {
      escrowId: escrow._id.toString(),
      agreementId: escrow.agreement.toString(),
      amount: escrow.amount,
      razorpayPaymentId: escrow.razorpayPaymentId,
      note,
    },
  });

  logger.info('Escrow refunded to tenant', {
    escrowId: escrow._id.toString(),
    adminId,
  });

  return populateEscrow(escrowId);
}

export async function markDisputed(
  userId: string,
  escrowId: string,
  note: string
): Promise<IEscrow> {
  const escrow = await findEscrowOrThrow(escrowId);

  const isTenant = refIdToString(escrow.tenant) === userId;
  const isOwner = refIdToString(escrow.owner) === userId;

  if (!isTenant && !isOwner) {
    throw new AppError('Escrow not found', 404, 'ESCROW_NOT_FOUND');
  }

  if (escrow.status !== 'held') {
    throw new AppError(
      'Only held escrows can be marked as disputed',
      400,
      'INVALID_ESCROW_STATUS'
    );
  }

  escrow.status = 'disputed';
  appendStatusHistory(escrow, 'disputed', userId, note);

  await escrow.save();

  logger.info('Escrow marked disputed', {
    escrowId: escrow._id.toString(),
    userId,
  });

  return populateEscrow(escrowId);
}

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}

/**
 * Defensive backup if the frontend verify call fails/is skipped.
 * In production, register this URL in the Razorpay dashboard; for local
 * dev we primarily rely on verifyAndCapturePayment after Checkout.
 */
export async function handlePaymentCapturedWebhook(
  payload: RazorpayWebhookPayload
): Promise<{ processed: boolean; escrowId?: string }> {
  if (payload.event !== 'payment.captured') {
    return { processed: false };
  }

  const payment = payload.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;

  if (!orderId || !paymentId) {
    logger.warn('Webhook payment.captured missing order/payment id', { payload });
    return { processed: false };
  }

  const escrow = await Escrow.findOne({ razorpayOrderId: orderId });

  if (!escrow) {
    logger.warn('Webhook: no escrow for order', { orderId });
    return { processed: false };
  }

  if (escrow.status !== 'pending') {
    return { processed: false, escrowId: escrow._id.toString() };
  }

  escrow.razorpayPaymentId = paymentId;
  escrow.status = 'held';
  appendStatusHistory(
    escrow,
    'held',
    null,
    'Payment captured via Razorpay webhook'
  );

  await escrow.save();

  logger.info('Escrow held via webhook', {
    escrowId: escrow._id.toString(),
    orderId,
    paymentId,
  });

  return { processed: true, escrowId: escrow._id.toString() };
}
