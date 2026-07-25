import { PROPERTY_MAX_FILE_SIZE_BYTES } from '@/constants/property.constants';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function validatePropertyPhoto(file: File): string | null {
  const ext = getExtension(file.name);
  const mime = file.type.toLowerCase();

  const allowed =
    (mime && ALLOWED_MIMES.includes(mime)) ||
    (ext && ALLOWED_EXTENSIONS.includes(ext));

  if (!allowed) {
    return 'Invalid file type. Allowed: JPG, JPEG, PNG, or WEBP';
  }

  if (file.size > PROPERTY_MAX_FILE_SIZE_BYTES) {
    return 'File too large. Maximum size is 5MB';
  }

  return null;
}

export function isPropertyImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
