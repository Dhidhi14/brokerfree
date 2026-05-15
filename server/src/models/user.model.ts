import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import { comparePassword as comparePasswordUtil, hashPassword } from '@/utils/password';

export type UserRole = 'tenant' | 'owner' | 'admin';

export type OwnerVerificationStatus = 'pending' | 'verified' | 'rejected';

export type DocumentType = 'aadhaar' | 'pan' | 'property-deed' | 'electricity-bill';

export interface IUserUploadedDocument {
  type: DocumentType;
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

export interface IUserTenantProfile {
  occupation: string;
  monthlyIncome: number;
  preferredCities: string[];
  budgetRange: { min: number; max: number };
  lifestyle: {
    smoking: boolean;
    drinking: boolean;
    vegetarian: boolean;
    pets: boolean;
  };
}

export interface IUserRating {
  average: number;
  count: number;
}

export interface IUser {
  email: string;
  phone: string;
  passwordHash: string;
  password?: string;
  role: UserRole;
  fullName: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAadhaarVerified: boolean;
  aadhaarLastFour?: string;
  digiLockerVerifiedAt?: Date;
  ownerVerificationStatus?: OwnerVerificationStatus;
  uploadedDocuments?: IUserUploadedDocument[];
  tenantProfile?: IUserTenantProfile;
  rating: IUserRating;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(plain: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods> & {
  password?: string;
};

const uploadedDocumentSchema = new Schema<IUserUploadedDocument>(
  {
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'property-deed', 'electricity-bill'],
      required: true,
    },
    url: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const tenantProfileSchema = new Schema<IUserTenantProfile>(
  {
    occupation: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    preferredCities: { type: [String], default: [] },
    budgetRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    lifestyle: {
      smoking: { type: Boolean, default: false },
      drinking: { type: Boolean, default: false },
      vegetarian: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser, mongoose.Model<IUser, object, IUserMethods>, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['tenant', 'owner', 'admin'],
      default: 'tenant',
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isAadhaarVerified: { type: Boolean, default: false },
    aadhaarLastFour: { type: String },
    digiLockerVerifiedAt: { type: Date },
    ownerVerificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
    },
    uploadedDocuments: [uploadedDocumentSchema],
    tenantProfile: tenantProfileSchema,
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const record = ret as Record<string, unknown>;
        delete record.passwordHash;
        delete record.password;
        delete record.__v;
        return record;
      },
    },
  }
);

userSchema.index({ role: 1, ownerVerificationStatus: 1 });

userSchema.pre('validate', async function () {
  if (this.isModified('password') && this.password) {
    this.passwordHash = await hashPassword(this.password);
    this.password = undefined;
  }
});

userSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return comparePasswordUtil(plain, this.passwordHash);
};

export const User = mongoose.model<IUser, mongoose.Model<IUser, object, IUserMethods>>(
  'User',
  userSchema
);
