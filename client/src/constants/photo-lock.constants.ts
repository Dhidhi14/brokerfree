import type {
  PhotoLockChangeSeverity,
  PhotoLockOverallCondition,
  PropertyArea,
} from '@/types/photo-lock.types';
import { PROPERTY_AREAS } from '@/types/photo-lock.types';

export { PROPERTY_AREAS };

export const PHOTO_LOCK_MAX_PHOTOS = 10;

export const PHOTO_LOCK_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const PHOTO_LOCK_ACCEPT_STRING =
  'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export const PROPERTY_AREA_LABELS: Record<PropertyArea, string> = {
  'living-room': 'Living room',
  kitchen: 'Kitchen',
  'bedroom-1': 'Bedroom 1',
  'bedroom-2': 'Bedroom 2',
  bathroom: 'Bathroom',
  balcony: 'Balcony',
  other: 'Other',
};

export const OVERALL_CONDITION_LABELS: Record<PhotoLockOverallCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  disputed: 'Disputed',
};

export const SEVERITY_LABELS: Record<PhotoLockChangeSeverity, string> = {
  none: 'No change',
  minor: 'Minor',
  significant: 'Significant',
};

export function getAreaLabel(area: string): string {
  if ((PROPERTY_AREAS as readonly string[]).includes(area)) {
    return PROPERTY_AREA_LABELS[area as PropertyArea];
  }
  return area;
}
