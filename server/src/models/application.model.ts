import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import {
  ACTIVE_APPLICATION_STATUSES,
  APPLICATION_MESSAGE_MAX_LENGTH,
  APPLICATION_STATUSES,
} from '@/constants/application.constants';

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface IApplication {
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  message: string;
  moveInDate: Date;
  occupants: number;
  status: ApplicationStatus;
  ownerResponse?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationDocument = HydratedDocument<IApplication>;

const applicationSchema = new Schema<IApplication>(
  {
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
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: APPLICATION_MESSAGE_MAX_LENGTH,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    occupants: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending',
    },
    ownerResponse: {
      type: String,
      trim: true,
      maxlength: APPLICATION_MESSAGE_MAX_LENGTH,
    },
    respondedAt: {
      type: Date,
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

// One active (pending/accepted) application per tenant+property; re-apply after reject/withdraw
applicationSchema.index(
  { property: 1, tenant: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [...ACTIVE_APPLICATION_STATUSES] },
    },
  }
);

applicationSchema.index({ owner: 1, status: 1 });
applicationSchema.index({ tenant: 1, status: 1 });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
