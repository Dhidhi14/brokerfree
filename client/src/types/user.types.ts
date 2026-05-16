export type UserRole = 'tenant' | 'owner' | 'admin';

export type OwnerVerificationStatus = 'pending' | 'verified' | 'rejected';

export type DocumentType = 'aadhaar' | 'pan' | 'property-deed' | 'electricity-bill';

export interface UserUploadedDocument {
  type: DocumentType;
  url: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface UserTenantProfile {
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

export interface UserRating {
  average: number;
  count: number;
}

export interface User {
  _id: string;
  email: string;
  phone: string;
  role: UserRole;
  fullName: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAadhaarVerified: boolean;
  aadhaarLastFour?: string;
  digiLockerVerifiedAt?: string;
  ownerVerificationStatus?: OwnerVerificationStatus;
  uploadedDocuments?: UserUploadedDocument[];
  tenantProfile?: UserTenantProfile;
  rating: UserRating;
  createdAt: string;
  updatedAt: string;
}
