import mongoose, { Schema, type HydratedDocument, type Types } from 'mongoose';
import { ESCROW_STATUSES, type EscrowStatus } from '@/constants/escrow.constants';

export interface IEscrowStatusHistoryEntry {
  status: EscrowStatus;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
  note?: string;
}

export interface IEscrow {
  agreement: Types.ObjectId;
  property: Types.ObjectId;
  tenant: Types.ObjectId;
  owner: Types.ObjectId;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: EscrowStatus;
  statusHistory: IEscrowStatusHistoryEntry[];
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EscrowDocument = HydratedDocument<IEscrow>;

const escrowStatusHistorySchema = new Schema<IEscrowStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ESCROW_STATUSES,
      required: true,
    },
    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
    },
  },
  { _id: false }
);

const escrowSchema = new Schema<IEscrow>(
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    status: {
      type: String,
      enum: ESCROW_STATUSES,
      default: 'pending',
      index: true,
    },
    statusHistory: {
      type: [escrowStatusHistorySchema],
      default: [],
    },
    releasedAt: {
      type: Date,
    },
    refundedAt: {
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

escrowSchema.index({ tenant: 1, status: 1 });
escrowSchema.index({ owner: 1, status: 1 });

export const Escrow = mongoose.model<IEscrow>('Escrow', escrowSchema);
