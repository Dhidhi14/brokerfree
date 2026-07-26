import { Application } from '@/models/application.model';
import * as applicationService from '@/services/application.service';
import { AppError } from '@/utils/app-error';
import { createPropertyDoc, createUser } from '@/tests/helpers';

describe('application.service', () => {
  beforeAll(async () => {
    await Application.syncIndexes();
  });

  it('rejects a second pending application to the same property', async () => {
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
    const property = await createPropertyDoc(owner._id.toString(), { status: 'live' });

    const payload = {
      propertyId: property._id.toString(),
      message: 'Interested in viewing this weekend.',
      moveInDate: new Date('2026-09-01'),
      occupants: 2,
    };

    await applicationService.createApplication(tenant._id.toString(), payload);

    await expect(
      applicationService.createApplication(tenant._id.toString(), payload)
    ).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'APPLICATION_EXISTS',
    } satisfies Partial<AppError>);
  });

  it('allows re-application after the previous application was rejected', async () => {
    const owner = await createUser({
      email: 'owner2@example.com',
      phone: '9876543212',
      role: 'owner',
      kycStatus: 'verified',
      ownerVerificationStatus: 'verified',
    });
    const tenant = await createUser({
      email: 'tenant2@example.com',
      phone: '9876543213',
      role: 'tenant',
    });
    const property = await createPropertyDoc(owner._id.toString(), { status: 'live' });

    const first = await applicationService.createApplication(tenant._id.toString(), {
      propertyId: property._id.toString(),
      message: 'First application',
      moveInDate: new Date('2026-09-01'),
      occupants: 1,
    });

    const firstId = String((first as unknown as { _id: unknown })._id);
    await Application.findByIdAndUpdate(firstId, { status: 'rejected' });

    const second = await applicationService.createApplication(tenant._id.toString(), {
      propertyId: property._id.toString(),
      message: 'Re-applying after rejection',
      moveInDate: new Date('2026-10-01'),
      occupants: 1,
    });

    expect(second.status).toBe('pending');
    expect(String((second as unknown as { _id: unknown })._id)).not.toBe(firstId);
  });
});
