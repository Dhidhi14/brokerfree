export const PROPERTY_AREAS = [
  'living-room',
  'kitchen',
  'bedroom-1',
  'bedroom-2',
  'bathroom',
  'balcony',
  'other',
] as const;

export type PropertyArea = (typeof PROPERTY_AREAS)[number];

export const PHOTO_LOCK_SUBMISSION_STATUSES = ['not_submitted', 'submitted'] as const;

export type PhotoLockSubmissionStatus = (typeof PHOTO_LOCK_SUBMISSION_STATUSES)[number];

export const PHOTO_LOCK_COMPARISON_STATUSES = ['not_available', 'completed'] as const;

export type PhotoLockComparisonStatus = (typeof PHOTO_LOCK_COMPARISON_STATUSES)[number];

export const PHOTO_LOCK_CHANGE_SEVERITIES = ['none', 'minor', 'significant'] as const;

export type PhotoLockChangeSeverity = (typeof PHOTO_LOCK_CHANGE_SEVERITIES)[number];

export const PHOTO_LOCK_OVERALL_CONDITIONS = ['good', 'fair', 'disputed'] as const;

export type PhotoLockOverallCondition = (typeof PHOTO_LOCK_OVERALL_CONDITIONS)[number];

export const PHOTO_LOCK_CLOUDINARY_MOVE_IN_FOLDER = 'brokerfree/photo-lock/move-in';

export const PHOTO_LOCK_CLOUDINARY_MOVE_OUT_FOLDER = 'brokerfree/photo-lock/move-out';

export const PHOTO_LOCK_MAX_PHOTOS = 10;

export const PHOTO_LOCK_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const PHOTO_LOCK_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const PHOTO_LOCK_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/** Demo trap area — mock comparison always flags minor wear here. */
export const PHOTO_LOCK_TRAP_AREA = 'kitchen' as const;
