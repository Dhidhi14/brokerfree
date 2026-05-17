import {
  KYC_ALLOWED_EXTENSIONS,
  KYC_ALLOWED_MIME_TYPES,
  KYC_MAX_FILE_SIZE_BYTES,
} from '@/constants/kyc.constants';

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex).toLowerCase();
}

function isAllowedMime(mimetype: string): boolean {
  const normalized = mimetype.trim().toLowerCase();
  return (KYC_ALLOWED_MIME_TYPES as readonly string[]).includes(normalized);
}

function isAllowedExtension(filename: string): boolean {
  const ext = getExtension(filename);
  return ext !== '' && (KYC_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateKycFile(file: File): string | null {
  if (file.size > KYC_MAX_FILE_SIZE_BYTES) {
    return 'File too large. Maximum size is 5MB';
  }

  if (!isAllowedMime(file.type) && !isAllowedExtension(file.name)) {
    return 'Invalid file type. Allowed: JPG, PNG, or PDF';
  }

  return null;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name);
}
