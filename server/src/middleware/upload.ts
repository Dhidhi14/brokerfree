import type { Request, Response, NextFunction } from 'express';
import multer, { type FileFilterCallback } from 'multer';
import {
  KYC_ALLOWED_EXTENSIONS,
  KYC_ALLOWED_MIME_TYPES,
  KYC_MAX_FILE_SIZE_BYTES,
} from '@/constants/kyc.constants';
import {
  PHOTO_LOCK_ALLOWED_EXTENSIONS,
  PHOTO_LOCK_ALLOWED_MIME_TYPES,
  PHOTO_LOCK_MAX_FILE_SIZE_BYTES,
  PHOTO_LOCK_MAX_PHOTOS,
} from '@/constants/photo-lock.constants';
import {
  PROPERTY_ALLOWED_EXTENSIONS,
  PROPERTY_ALLOWED_MIME_TYPES,
  PROPERTY_MAX_FILE_SIZE_BYTES,
  PROPERTY_MAX_PHOTOS,
  PROPERTY_MAX_VIDEO_SIZE_BYTES,
  PROPERTY_VIDEO_ALLOWED_EXTENSIONS,
  PROPERTY_VIDEO_ALLOWED_MIME_TYPES,
} from '@/constants/property.constants';
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

function handleMulterError(err: unknown, next: NextFunction, maxSizeLabel: string): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(`File too large. Maximum size is ${maxSizeLabel}`, 400, 'FILE_TOO_LARGE'));
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      next(new AppError('Unexpected file field', 400, 'INVALID_FILE_FIELD'));
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      next(
        new AppError(`Too many files. Maximum is ${PROPERTY_MAX_PHOTOS}`, 400, 'TOO_MANY_FILES')
      );
      return;
    }
    next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
    return;
  }
  next(err);
}

export function handleKycUpload(req: Request, res: Response, next: NextFunction): void {
  uploadKycDocuments(req, res, (err: unknown) => {
    handleMulterError(err, next, '5MB');
  });
}

const normalizedPropertyMimes = PROPERTY_ALLOWED_MIME_TYPES.map((mime) => mime.toLowerCase());

function isAllowedPropertyFile(file: Express.Multer.File): boolean {
  const normalizedMime = normalizeMime(file.mimetype);
  const ext = getExtension(file.originalname);
  return (
    (normalizedMime !== '' && normalizedPropertyMimes.includes(normalizedMime)) ||
    (ext !== '' && (PROPERTY_ALLOWED_EXTENSIONS as readonly string[]).includes(ext))
  );
}

function propertyPhotoFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (isAllowedPropertyFile(file)) {
    cb(null, true);
    return;
  }

  cb(
    new AppError(
      'Invalid file type. Allowed: JPG, JPEG, PNG, or WEBP',
      400,
      'INVALID_FILE_TYPE'
    )
  );
}

const propertyPhotoUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: PROPERTY_MAX_FILE_SIZE_BYTES, files: PROPERTY_MAX_PHOTOS },
  fileFilter: propertyPhotoFileFilter,
});

export const uploadPropertyPhotos = propertyPhotoUpload.array('photos', PROPERTY_MAX_PHOTOS);

export function handlePropertyPhotoUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  uploadPropertyPhotos(req, res, (err: unknown) => {
    handleMulterError(err, next, '5MB');
  });
}

const normalizedVideoMimes = PROPERTY_VIDEO_ALLOWED_MIME_TYPES.map((mime) =>
  mime.toLowerCase()
);

function isAllowedVideoFile(file: Express.Multer.File): boolean {
  const normalizedMime = normalizeMime(file.mimetype);
  const ext = getExtension(file.originalname);
  return (
    (normalizedMime !== '' && normalizedVideoMimes.includes(normalizedMime)) ||
    (ext !== '' && (PROPERTY_VIDEO_ALLOWED_EXTENSIONS as readonly string[]).includes(ext))
  );
}

function propertyVideoFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (isAllowedVideoFile(file)) {
    cb(null, true);
    return;
  }

  cb(
    new AppError(
      'Invalid file type. Allowed: MP4, MOV, or WEBM',
      400,
      'INVALID_FILE_TYPE'
    )
  );
}

const propertyVideoUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: PROPERTY_MAX_VIDEO_SIZE_BYTES, files: 1 },
  fileFilter: propertyVideoFileFilter,
});

export const uploadPropertyVideo = propertyVideoUpload.single('video');

export function handleVideoUpload(req: Request, res: Response, next: NextFunction): void {
  uploadPropertyVideo(req, res, (err: unknown) => {
    handleMulterError(err, next, '50MB');
  });
}

const normalizedPhotoLockMimes = PHOTO_LOCK_ALLOWED_MIME_TYPES.map((mime) =>
  mime.toLowerCase()
);

function isAllowedPhotoLockFile(file: Express.Multer.File): boolean {
  const normalizedMime = normalizeMime(file.mimetype);
  const ext = getExtension(file.originalname);
  return (
    (normalizedMime !== '' && normalizedPhotoLockMimes.includes(normalizedMime)) ||
    (ext !== '' && (PHOTO_LOCK_ALLOWED_EXTENSIONS as readonly string[]).includes(ext))
  );
}

function photoLockFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (isAllowedPhotoLockFile(file)) {
    cb(null, true);
    return;
  }

  cb(
    new AppError(
      'Invalid file type. Allowed: JPG, JPEG, PNG, or WEBP',
      400,
      'INVALID_FILE_TYPE'
    )
  );
}

const photoLockUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: PHOTO_LOCK_MAX_FILE_SIZE_BYTES, files: PHOTO_LOCK_MAX_PHOTOS },
  fileFilter: photoLockFileFilter,
});

export const uploadPhotoLockPhotos = photoLockUpload.array('photos', PHOTO_LOCK_MAX_PHOTOS);

export function handlePhotoLockUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  uploadPhotoLockPhotos(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('File too large. Maximum size is 5MB', 400, 'FILE_TOO_LARGE'));
        return;
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new AppError('Unexpected file field', 400, 'INVALID_FILE_FIELD'));
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        next(
          new AppError(
            `Too many files. Maximum is ${PHOTO_LOCK_MAX_PHOTOS}`,
            400,
            'TOO_MANY_FILES'
          )
        );
        return;
      }
      next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
      return;
    }
    next(err);
  });
}
