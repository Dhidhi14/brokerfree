import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import {
  AGREEMENT_STATUSES,
  DEFAULT_LEASE_DURATION_MONTHS,
  DEFAULT_NOTICE_PERIOD_DAYS,
} from '@/constants/agreement.constants';

export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

export interface IAgreementTerms {
  rent: number;
  deposit: number;
  maintenance: number;
  moveInDate: Date;
  leaseDurationMonths: number;
  noticePeriodDays: number;
}

export interface IAgreement {
  application: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  terms: IAgreementTerms;
  pdfUrl: string;
  pdfPublicId: string;
  status: AgreementStatus;
  tenantSignedAt?: Date;
  ownerSignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AgreementDocument = HydratedDocument<IAgreement>;

const agreementTermsSchema = new Schema<IAgreementTerms>(
  {
    rent: { type: Number, required: true, min: 1 },
    deposit: { type: Number, required: true, min: 0 },
    maintenance: { type: Number, required: true, min: 0 },
    moveInDate: { type: Date, required: true },
    leaseDurationMonths: {
      type: Number,
      required: true,
      min: 1,
      default: DEFAULT_LEASE_DURATION_MONTHS,
    },
    noticePeriodDays: {
      type: Number,
      required: true,
      min: 1,
      default: DEFAULT_NOTICE_PERIOD_DAYS,
    },
  },
  { _id: false }
);

const agreementSchema = new Schema<IAgreement>(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
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
    terms: {
      type: agreementTermsSchema,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    pdfPublicId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: AGREEMENT_STATUSES,
      default: 'draft',
    },
    tenantSignedAt: {
      type: Date,
    },
    ownerSignedAt: {
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

agreementSchema.index({ tenant: 1, status: 1 });
agreementSchema.index({ owner: 1, status: 1 });

export const Agreement = mongoose.model<IAgreement>('Agreement', agreementSchema);
