import type { Request, Response } from 'express';
import type { PropertyArea } from '@/constants/photo-lock.constants';
import * as photoLockService from '@/services/photo-lock.service';
import { AppError } from '@/utils/app-error';
import type { SubmitPhotoLockInput } from '@/validators/photo-lock.validator';

function getPhotoFiles(req: Request): Express.Multer.File[] {
  const files = req.files;

  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError('At least one photo is required', 400, 'MISSING_PHOTOS');
  }

  return files;
}

function buildPhotoUploads(
  files: Express.Multer.File[],
  areas: PropertyArea[]
): Array<{ area: PropertyArea; buffer: Buffer }> {
  if (files.length !== areas.length) {
    throw new AppError(
      'Number of photos must match number of areas',
      400,
      'PHOTO_AREA_MISMATCH'
    );
  }

  return files.map((file, index) => ({
    area: areas[index]!,
    buffer: file.buffer,
  }));
}

export async function getPhotoLock(req: Request, res: Response): Promise<void> {
  const agreementId = req.params.agreementId as string;

  const photoLock = await photoLockService.getOrCreatePhotoLock(
    agreementId,
    req.user!.id,
    req.user!.role
  );

  res.status(200).json({
    success: true,
    data: { photoLock },
  });
}

export async function submitMoveIn(req: Request, res: Response): Promise<void> {
  const agreementId = req.params.agreementId as string;
  const { areas } = req.body as SubmitPhotoLockInput;
  const photos = buildPhotoUploads(getPhotoFiles(req), areas);

  const photoLock = await photoLockService.submitMoveInPhotos(
    req.user!.id,
    agreementId,
    photos
  );

  res.status(200).json({
    success: true,
    data: { photoLock },
  });
}

export async function submitMoveOut(req: Request, res: Response): Promise<void> {
  const agreementId = req.params.agreementId as string;
  const { areas } = req.body as SubmitPhotoLockInput;
  const photos = buildPhotoUploads(getPhotoFiles(req), areas);

  const photoLock = await photoLockService.submitMoveOutPhotos(
    req.user!.id,
    agreementId,
    photos
  );

  res.status(200).json({
    success: true,
    data: { photoLock },
  });
}
