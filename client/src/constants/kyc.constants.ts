export const KYC_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const KYC_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
] as const;

export const KYC_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;

export const KYC_ACCEPT_STRING = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
