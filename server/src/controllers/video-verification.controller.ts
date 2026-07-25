import type { Request, Response } from 'express';
import * as videoVerificationService from '@/services/video-verification.service';
import { AppError } from '@/utils/app-error';

function getVideoFile(req: Request): Express.Multer.File {
  const file = req.file;

  if (!file) {
    throw new AppError('Video file is required', 400, 'MISSING_VIDEO');
  }

  return file;
}

export async function submitVideo(req: Request, res: Response): Promise<void> {
  const propertyId = req.params.id as string;
  const videoFile = getVideoFile(req);

  const result = await videoVerificationService.submitVideoForVerification(
    propertyId,
    req.user!.id,
    videoFile.buffer
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getVideoStatus(req: Request, res: Response): Promise<void> {
  const propertyId = req.params.id as string;

  const videoVerification = await videoVerificationService.getVideoVerificationStatus(
    propertyId,
    req.user!.id,
    req.user!.role
  );

  res.status(200).json({
    success: true,
    data: { videoVerification },
  });
}
