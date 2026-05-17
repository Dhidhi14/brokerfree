export const KYC_CLOUDINARY_FOLDER = 'brokerfree/kyc';

export const KYC_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Standard MIME types; compared case-insensitively in upload middleware. */
export const KYC_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
] as const;

/** Fallback when clients send a generic or missing MIME type (e.g. application/octet-stream). */
export const KYC_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;
