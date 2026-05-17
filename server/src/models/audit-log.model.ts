import mongoose, { Schema, type HydratedDocument, type Types } from 'mongoose';

export interface IAuditLog {
  action: string;
  performedBy: Types.ObjectId;
  targetUser: Types.ObjectId;
  details: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ targetUser: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
