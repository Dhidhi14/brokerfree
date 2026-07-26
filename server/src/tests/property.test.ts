import * as cloudinaryService from '@/services/cloudinary.service';
import * as propertyService from '@/services/property.service';
import { AppError } from '@/utils/app-error';
import {
  createPropertyDoc,
  createUser,
  fakePhotoFile,
  samplePropertyInput,
} from '@/tests/helpers';

jest.mock('@/services/cloudinary.service', () => ({
  uploadDocument: jest.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/test/image/upload/photo.jpg',
    publicId: 'brokerfree/properties/photo',
  }),
  deleteDocument: jest.fn().mockResolvedValue(undefined),
  uploadVideo: jest.fn(),
  uploadImage: jest.fn(),
}));

describe('property.service', () => {
  it('rejects property creation when the owner is not KYC-verified', async () => {
    const owner = await createUser({
      email: 'unverified@example.com',
      phone: '9876543210',
      role: 'owner',
      kycStatus: 'pending',
      ownerVerificationStatus: 'pending',
    });

    await expect(
      propertyService.createProperty(owner._id.toString(), samplePropertyInput, [
        fakePhotoFile(),
      ])
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'OWNER_NOT_VERIFIED',
    } satisfies Partial<AppError>);

    expect(cloudinaryService.uploadDocument).not.toHaveBeenCalled();
  });

  it('creates a property with pending-verification status for a verified owner', async () => {
    const owner = await createUser({
      email: 'verified@example.com',
      phone: '9876543211',
      role: 'owner',
      kycStatus: 'verified',
      ownerVerificationStatus: 'verified',
    });

    const property = await propertyService.createProperty(
      owner._id.toString(),
      samplePropertyInput,
      [fakePhotoFile()]
    );

    expect(property.status).toBe('pending-verification');
    expect(property.title).toBe(samplePropertyInput.title);
    expect(property.owner.toString()).toBe(owner._id.toString());
    expect(cloudinaryService.uploadDocument).toHaveBeenCalled();
  });

  it('rejects update and delete from a non-owner', async () => {
    const owner = await createUser({
      email: 'owner@example.com',
      phone: '9876543212',
      role: 'owner',
      kycStatus: 'verified',
      ownerVerificationStatus: 'verified',
    });
    const other = await createUser({
      email: 'other@example.com',
      phone: '9876543213',
      role: 'owner',
      kycStatus: 'verified',
      ownerVerificationStatus: 'verified',
    });
    const property = await createPropertyDoc(owner._id.toString());

    await expect(
      propertyService.updateProperty(property._id.toString(), other._id.toString(), {
        title: 'Hacked title change',
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    } satisfies Partial<AppError>);

    await expect(
      propertyService.deleteProperty(property._id.toString(), other._id.toString())
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'FORBIDDEN',
    } satisfies Partial<AppError>);

    expect(cloudinaryService.deleteDocument).not.toHaveBeenCalled();
  });
});
