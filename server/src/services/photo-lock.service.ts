import mongoose from 'mongoose';
import {
  PHOTO_LOCK_CLOUDINARY_MOVE_IN_FOLDER,
  PHOTO_LOCK_CLOUDINARY_MOVE_OUT_FOLDER,
  type PropertyArea,
} from '@/constants/photo-lock.constants';
import { Agreement } from '@/models/agreement.model';
import {
  PhotoLock,
  type IPhotoLock,
  type IPhotoLockPhoto,
  type PhotoLockDocument,
} from '@/models/photo-lock.model';
import type { UserRole } from '@/models/user.model';
import { uploadImage } from '@/services/cloudinary.service';
import { comparePhotoSets } from '@/services/photo-comparison.service';
import { AppError } from '@/utils/app-error';

export interface PhotoUploadInput {
  area: PropertyArea;
  buffer: Buffer;
}

function refIdToString(value: unknown): string {
  if (value !== null && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function assertCanView(
  photoLock: { tenant: unknown; owner: unknown },
  viewerId: string,
  viewerRole: UserRole
): void {
  if (viewerRole === 'admin') {
    return;
  }

  const isTenant = refIdToString(photoLock.tenant) === viewerId;
  const isOwner = refIdToString(photoLock.owner) === viewerId;

  if (!isTenant && !isOwner) {
    throw new AppError('Photo lock not found', 404, 'PHOTO_LOCK_NOT_FOUND');
  }
}

async function findExecutedAgreementOrThrow(agreementId: string) {
  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  const agreement = await Agreement.findById(agreementId);

  if (!agreement) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  if (agreement.status !== 'executed') {
    throw new AppError(
      'Photo lock is only available for executed agreements',
      400,
      'AGREEMENT_NOT_EXECUTED'
    );
  }

  return agreement;
}

async function populatePhotoLock(photoLockId: string): Promise<IPhotoLock> {
  const photoLock = await PhotoLock.findById(photoLockId)
    .populate({
      path: 'property',
      select: 'title address',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone email',
    })
    .populate({
      path: 'owner',
      select: 'fullName phone email',
    })
    .populate({
      path: 'agreement',
      select: 'status terms',
    })
    .lean();

  if (!photoLock) {
    throw new AppError('Photo lock not found', 404, 'PHOTO_LOCK_NOT_FOUND');
  }

  return photoLock as unknown as IPhotoLock;
}

async function uploadPhotos(
  photos: PhotoUploadInput[],
  folder: string
): Promise<IPhotoLockPhoto[]> {
  const uploaded = await Promise.all(
    photos.map(async (photo) => {
      const result = await uploadImage(photo.buffer, folder);
      return {
        area: photo.area,
        url: result.url,
        publicId: result.publicId,
        uploadedAt: new Date(),
      };
    })
  );

  return uploaded;
}

/**
 * Returns the photo lock for an executed agreement, creating an empty shell if needed.
 */
export async function getOrCreatePhotoLock(
  agreementId: string,
  userId: string,
  userRole: UserRole
): Promise<IPhotoLock> {
  const agreement = await findExecutedAgreementOrThrow(agreementId);

  const isTenant = refIdToString(agreement.tenant) === userId;
  const isOwner = refIdToString(agreement.owner) === userId;

  if (userRole !== 'admin' && !isTenant && !isOwner) {
    throw new AppError('Photo lock not found', 404, 'PHOTO_LOCK_NOT_FOUND');
  }

  let photoLock = await PhotoLock.findOne({ agreement: agreementId });

  if (!photoLock) {
    photoLock = await PhotoLock.create({
      agreement: agreement._id,
      property: agreement.property,
      tenant: agreement.tenant,
      owner: agreement.owner,
      moveIn: { status: 'not_submitted', photos: [] },
      moveOut: { status: 'not_submitted', photos: [] },
      comparison: { status: 'not_available', findings: [] },
    });
  }

  return populatePhotoLock(photoLock._id.toString());
}

/**
 * Fetches an existing photo lock. 404 if missing or viewer is not a participant/admin.
 */
export async function getPhotoLock(
  agreementId: string,
  viewerId: string,
  viewerRole: UserRole
): Promise<IPhotoLock> {
  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Photo lock not found', 404, 'PHOTO_LOCK_NOT_FOUND');
  }

  const photoLock = await PhotoLock.findOne({ agreement: agreementId });

  if (!photoLock) {
    throw new AppError('Photo lock not found', 404, 'PHOTO_LOCK_NOT_FOUND');
  }

  assertCanView(photoLock, viewerId, viewerRole);

  return populatePhotoLock(photoLock._id.toString());
}

export async function submitMoveInPhotos(
  tenantId: string,
  agreementId: string,
  photos: PhotoUploadInput[]
): Promise<IPhotoLock> {
  if (!photos.length) {
    throw new AppError('At least one photo is required', 400, 'MISSING_PHOTOS');
  }

  const agreement = await findExecutedAgreementOrThrow(agreementId);

  if (refIdToString(agreement.tenant) !== tenantId) {
    throw new AppError(
      'Only the tenant on this agreement can submit move-in photos',
      403,
      'FORBIDDEN'
    );
  }

  let photoLock: PhotoLockDocument | null = await PhotoLock.findOne({
    agreement: agreementId,
  });

  if (!photoLock) {
    photoLock = await PhotoLock.create({
      agreement: agreement._id,
      property: agreement.property,
      tenant: agreement.tenant,
      owner: agreement.owner,
      moveIn: { status: 'not_submitted', photos: [] },
      moveOut: { status: 'not_submitted', photos: [] },
      comparison: { status: 'not_available', findings: [] },
    });
  }

  if (photoLock.moveIn.status !== 'not_submitted') {
    throw new AppError(
      'Move-in photos have already been submitted',
      400,
      'MOVE_IN_ALREADY_SUBMITTED'
    );
  }

  const uploadedPhotos = await uploadPhotos(photos, PHOTO_LOCK_CLOUDINARY_MOVE_IN_FOLDER);

  photoLock.moveIn = {
    status: 'submitted',
    photos: uploadedPhotos,
    submittedAt: new Date(),
  };

  await photoLock.save();

  return populatePhotoLock(photoLock._id.toString());
}

export async function submitMoveOutPhotos(
  tenantId: string,
  agreementId: string,
  photos: PhotoUploadInput[]
): Promise<IPhotoLock> {
  if (!photos.length) {
    throw new AppError('At least one photo is required', 400, 'MISSING_PHOTOS');
  }

  const agreement = await findExecutedAgreementOrThrow(agreementId);

  if (refIdToString(agreement.tenant) !== tenantId) {
    throw new AppError(
      'Only the tenant on this agreement can submit move-out photos',
      403,
      'FORBIDDEN'
    );
  }

  const photoLock = await PhotoLock.findOne({ agreement: agreementId });

  if (!photoLock) {
    throw new AppError(
      'Submit move-in photos before move-out',
      400,
      'MOVE_IN_REQUIRED'
    );
  }

  if (photoLock.moveIn.status !== 'submitted') {
    throw new AppError(
      'Submit move-in photos before move-out',
      400,
      'MOVE_IN_REQUIRED'
    );
  }

  if (photoLock.moveOut.status !== 'not_submitted') {
    throw new AppError(
      'Move-out photos have already been submitted',
      400,
      'MOVE_OUT_ALREADY_SUBMITTED'
    );
  }

  const uploadedPhotos = await uploadPhotos(photos, PHOTO_LOCK_CLOUDINARY_MOVE_OUT_FOLDER);

  photoLock.moveOut = {
    status: 'submitted',
    photos: uploadedPhotos,
    submittedAt: new Date(),
  };

  const comparison = await comparePhotoSets(photoLock.moveIn.photos, uploadedPhotos);

  photoLock.comparison = {
    status: 'completed',
    findings: comparison.findings,
    overallCondition: comparison.overallCondition,
    comparedAt: comparison.comparedAt,
  };

  await photoLock.save();

  return populatePhotoLock(photoLock._id.toString());
}
