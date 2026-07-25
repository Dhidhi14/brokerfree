import {
  PROPERTY_MAX_VIDEO_SIZE_BYTES,
  PROPERTY_VIDEO_ALLOWED_EXTENSIONS,
  PROPERTY_VIDEO_ALLOWED_MIME_TYPES,
} from '@/constants/property.constants';

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function validatePropertyVideo(file: File): string | null {
  const ext = getExtension(file.name);
  const mime = file.type.toLowerCase();

  const allowed =
    (mime &&
      (PROPERTY_VIDEO_ALLOWED_MIME_TYPES as readonly string[]).includes(mime)) ||
    (ext &&
      (PROPERTY_VIDEO_ALLOWED_EXTENSIONS as readonly string[]).includes(ext));

  if (!allowed) {
    return 'Invalid file type. Allowed: MP4, MOV, or WEBM';
  }

  if (file.size > PROPERTY_MAX_VIDEO_SIZE_BYTES) {
    return 'File too large. Maximum size is 50MB';
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
