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

export type PhotoLockSubmissionStatus = 'not_submitted' | 'submitted';

export type PhotoLockComparisonStatus = 'not_available' | 'completed';

export type PhotoLockChangeSeverity = 'none' | 'minor' | 'significant';

export type PhotoLockOverallCondition = 'good' | 'fair' | 'disputed';

export interface PhotoLockPhoto {
  area: PropertyArea | string;
  url: string;
  publicId: string;
  uploadedAt: string;
}

export interface PhotoLockSubmission {
  status: PhotoLockSubmissionStatus;
  photos: PhotoLockPhoto[];
  submittedAt?: string;
}

export interface PhotoLockFinding {
  area: string;
  changeDetected: boolean;
  severity: PhotoLockChangeSeverity;
  description: string;
}

export interface PhotoLockComparison {
  status: PhotoLockComparisonStatus;
  findings: PhotoLockFinding[];
  overallCondition?: PhotoLockOverallCondition;
  comparedAt?: string;
}

export interface PhotoLock {
  _id: string;
  agreement: string;
  property: string;
  tenant: string;
  owner: string;
  moveIn: PhotoLockSubmission;
  moveOut: PhotoLockSubmission;
  comparison: PhotoLockComparison;
  createdAt: string;
  updatedAt: string;
}

export interface AreaPhotoSelection {
  area: PropertyArea;
  file: File;
}
