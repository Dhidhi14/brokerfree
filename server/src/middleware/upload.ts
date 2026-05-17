import type { Request, Response, NextFunction } from 'express';
import multer, { type FileFilterCallback } from 'multer';
import {
  KYC_ALLOWED_EXTENSIONS,
  KYC_ALLOWED_MIME_TYPES,
  KYC_MAX_FILE_SIZE_BYTES,
} from '@/constants/kyc.constants';
import { AppError } from '@/utils/app-error';

const memoryStorage = multer.memoryStorage();

const normalizedAllowedMimes = KYC_ALLOWED_MIME_TYPES.map((mime) => mime.toLowerCase());

function normalizeMime(mimetype: string): string {
  return mimetype.trim().toLowerCase();
}

function getExtension(originalname: string): string {
  const dotIndex = originalname.lastIndexOf('.');
  if (dotIndex === -1) {
    return '';
  }
  return originalname.slice(dotIndex).toLowerCase();
}

function isAllowedMimeType(mimetype: string): boolean {
  const normalized = normalizeMime(mimetype);
  if (!normalized) {
    return false;
  }
  return normalizedAllowedMimes.includes(normalized);
}

function isAllowedExtension(originalname: string): boolean {
  const ext = getExtension(originalname);
  if (!ext) {
    return false;
  }
  return (KYC_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

function isAllowedKycFile(file: Express.Multer.File): boolean {
  return isAllowedMimeType(file.mimetype) || isAllowedExtension(file.originalname);
}

function kycFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  console.log('[KYC upload] received file:', {
    mimetype: file.mimetype,
    originalname: file.originalname,
  });

  if (isAllowedKycFile(file)) {
    cb(null, true);
    return;
  }

  cb(
    new AppError(
      'Invalid file type. Allowed: JPG, JPEG, PNG, or PDF',
      400,
      'INVALID_FILE_TYPE'
    )
  );
}

const kycUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: KYC_MAX_FILE_SIZE_BYTES },
  fileFilter: kycFileFilter,
});

export const uploadKycDocuments = kycUpload.fields([
  { name: 'aadhaarDoc', maxCount: 1 },
  { name: 'panDoc', maxCount: 1 },
]);

export function handleKycUpload(req: Request, res: Response, next: NextFunction): void {
  uploadKycDocuments(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('File too large. Maximum size is 5MB', 400, 'FILE_TOO_LARGE'));
        return;
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new AppError('Unexpected file field', 400, 'INVALID_FILE_FIELD'));
        return;
      }
      next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
      return;
    }
    next(err);
  });
}
