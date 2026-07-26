import mongoose, { Schema, type HydratedDocument, type Types } from 'mongoose';
import {
  PHOTO_LOCK_CHANGE_SEVERITIES,
  PHOTO_LOCK_COMPARISON_STATUSES,
  PHOTO_LOCK_OVERALL_CONDITIONS,
  PHOTO_LOCK_SUBMISSION_STATUSES,
  PROPERTY_AREAS,
  type PhotoLockChangeSeverity,
  type PhotoLockComparisonStatus,
  type PhotoLockOverallCondition,
  type PhotoLockSubmissionStatus,
  type PropertyArea,
} from '@/constants/photo-lock.constants';

export interface IPhotoLockPhoto {
  area: PropertyArea | string;
  url: string;
  publicId: string;
  uploadedAt: Date;
}

export interface IPhotoLockSubmission {
  status: PhotoLockSubmissionStatus;
  photos: IPhotoLockPhoto[];
  submittedAt?: Date;
}

export interface IPhotoLockFinding {
  area: string;
  changeDetected: boolean;
  severity: PhotoLockChangeSeverity;
  description: string;
}

export interface IPhotoLockComparison {
  status: PhotoLockComparisonStatus;
  findings: IPhotoLockFinding[];
  overallCondition?: PhotoLockOverallCondition;
  comparedAt?: Date;
}

export interface IPhotoLock {
  agreement: Types.ObjectId;
  property: Types.ObjectId;
  tenant: Types.ObjectId;
  owner: Types.ObjectId;
  moveIn: IPhotoLockSubmission;
  moveOut: IPhotoLockSubmission;
  comparison: IPhotoLockComparison;
  createdAt: Date;
  updatedAt: Date;
}

export type PhotoLockDocument = HydratedDocument<IPhotoLock>;

const photoLockPhotoSchema = new Schema<IPhotoLockPhoto>(
  {
    area: {
      type: String,
      required: true,
      enum: PROPERTY_AREAS,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const photoLockSubmissionSchema = new Schema<IPhotoLockSubmission>(
  {
    status: {
      type: String,
      enum: PHOTO_LOCK_SUBMISSION_STATUSES,
      default: 'not_submitted',
      required: true,
    },
    photos: {
      type: [photoLockPhotoSchema],
      default: [],
    },
    submittedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const photoLockFindingSchema = new Schema<IPhotoLockFinding>(
  {
    area: {
      type: String,
      required: true,
    },
    changeDetected: {
      type: Boolean,
      required: true,
    },
    severity: {
      type: String,
      enum: PHOTO_LOCK_CHANGE_SEVERITIES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      default: '',
    },
  },
  { _id: false }
);

const photoLockComparisonSchema = new Schema<IPhotoLockComparison>(
  {
    status: {
      type: String,
      enum: PHOTO_LOCK_COMPARISON_STATUSES,
      default: 'not_available',
      required: true,
    },
    findings: {
      type: [photoLockFindingSchema],
      default: [],
    },
    overallCondition: {
      type: String,
      enum: PHOTO_LOCK_OVERALL_CONDITIONS,
    },
    comparedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const photoLockSchema = new Schema<IPhotoLock>(
  {
    agreement: {
      type: Schema.Types.ObjectId,
      ref: 'Agreement',
      required: true,
      unique: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moveIn: {
      type: photoLockSubmissionSchema,
      default: () => ({ status: 'not_submitted', photos: [] }),
    },
    moveOut: {
      type: photoLockSubmissionSchema,
      default: () => ({ status: 'not_submitted', photos: [] }),
    },
    comparison: {
      type: photoLockComparisonSchema,
      default: () => ({ status: 'not_available', findings: [] }),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const record = ret as Record<string, unknown>;
        delete record.__v;
        return record;
      },
    },
  }
);

export const PhotoLock = mongoose.model<IPhotoLock>('PhotoLock', photoLockSchema);
