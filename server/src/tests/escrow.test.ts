import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '@/config/env';
import { Agreement } from '@/models/agreement.model';
import * as escrowService from '@/services/escrow.service';
import { AppError } from '@/utils/app-error';
import { createPropertyDoc, createUser } from '@/tests/helpers';

describe('escrow.service', () => {
  function signCheckout(orderId: string, paymentId: string): string {
    return crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  it('accepts a valid HMAC-SHA256 checkout signature', () => {
    const orderId = 'order_test_123';
    const paymentId = 'pay_test_456';
    const signature = signCheckout(orderId, paymentId);

    expect(escrowService.verifyCheckoutSignature(orderId, paymentId, signature)).toBe(true);
  });

  it('rejects a tampered or invalid checkout signature', () => {
    const orderId = 'order_test_123';
    const paymentId = 'pay_test_456';
    const valid = signCheckout(orderId, paymentId);

    expect(
      escrowService.verifyCheckoutSignature(orderId, paymentId, `${valid.slice(0, -1)}a`)
    ).toBe(false);
    expect(escrowService.verifyCheckoutSignature(orderId, paymentId, 'not-a-valid-sig')).toBe(
      false
    );
  });

  it('rejects a non-tenant (owner) creating an escrow order for the agreement', async () => {
    const owner = await createUser({
      email: 'owner@example.com',
      phone: '9876543210',
      role: 'owner',
      kycStatus: 'verified',
      ownerVerificationStatus: 'verified',
    });
    const tenant = await createUser({
      email: 'tenant@example.com',
      phone: '9876543211',
      role: 'tenant',
    });
    const property = await createPropertyDoc(owner._id.toString());

    const agreement = await Agreement.create({
      application: new mongoose.Types.ObjectId(),
      property: property._id,
      tenant: tenant._id,
      owner: owner._id,
      terms: {
        rent: 28000,
        deposit: 56000,
        maintenance: 2500,
        moveInDate: new Date('2026-08-01'),
        leaseDurationMonths: 11,
        noticePeriodDays: 30,
      },
      pdfUrl: 'https://example.com/agreement.pdf',
      pdfPublicId: 'brokerfree/agreements/test',
      status: 'executed',
      tenantSignedAt: new Date(),
      ownerSignedAt: new Date(),
    });

    await expect(
      escrowService.createEscrowOrder(owner._id.toString(), agreement._id.toString())
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });
});
