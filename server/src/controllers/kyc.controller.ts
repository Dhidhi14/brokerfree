import type { Request, Response } from 'express';
import * as kycService from '@/services/kyc.service';
import { AppError } from '@/utils/app-error';
import type { ReviewKycInput, SubmitKycInput } from '@/validators/kyc.validator';

type KycFileFields = {
  aadhaarDoc?: Express.Multer.File[];
  panDoc?: Express.Multer.File[];
};

function getKycFiles(req: Request): kycService.KycSubmitFiles {
  const files = req.files as KycFileFields | undefined;
  const aadhaarDoc = files?.aadhaarDoc?.[0];
  const panDoc = files?.panDoc?.[0];

  if (!aadhaarDoc || !panDoc) {
    throw new AppError(
      'Both aadhaarDoc and panDoc files are required',
      400,
      'MISSING_DOCUMENTS'
    );
  }

  return { aadhaarDoc, panDoc };
}

export async function submitKyc(req: Request, res: Response): Promise<void> {
  const kyc = await kycService.submitKyc(
    req.user!.id,
    req.body as SubmitKycInput,
    getKycFiles(req)
  );

  res.status(200).json({
    success: true,
    data: { kyc },
  });
}

export async function getMyKycStatus(req: Request, res: Response): Promise<void> {
  const kyc = await kycService.getKycStatus(req.user!.id);

  res.status(200).json({
    success: true,
    data: { kyc },
  });
}

export async function listPendingKyc(_req: Request, res: Response): Promise<void> {
  const pending = await kycService.listPendingKyc();

  res.status(200).json({
    success: true,
    data: { pending },
  });
}

export async function reviewKyc(req: Request, res: Response): Promise<void> {
  const kyc = await kycService.reviewKyc(
    req.user!.id,
    req.params.userId as string,
    req.body as ReviewKycInput
  );

  res.status(200).json({
    success: true,
    data: { kyc },
  });
}
