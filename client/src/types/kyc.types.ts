export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export type KycDocumentType = 'aadhaar' | 'pan';

export interface KycDocument {
  type: KycDocumentType;
  url: string;
  publicId: string;
  uploadedAt: string;
}

export interface UserKyc {
  status: KycStatus;
  documents: KycDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  aadhaarLast4?: string;
  panLast4?: string;
}

export interface PendingKycOwner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  kyc: UserKyc;
  submittedAt?: string;
}
