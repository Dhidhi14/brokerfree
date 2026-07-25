export type AgreementStatus = 'draft' | 'pending-signatures' | 'executed';

export interface AgreementTerms {
  rent: number;
  deposit: number;
  maintenance: number;
  moveInDate: string;
  leaseDurationMonths: number;
  noticePeriodDays: number;
}

export interface AgreementPropertySummary {
  _id: string;
  title: string;
  address?: {
    line1?: string;
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  rent?: number;
  deposit?: number;
  maintenance?: number;
}

export interface AgreementPartySummary {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

export interface AgreementApplicationSummary {
  _id: string;
  status: string;
  moveInDate?: string;
}

export interface Agreement {
  _id: string;
  application: string | AgreementApplicationSummary;
  property: string | AgreementPropertySummary;
  tenant: string | AgreementPartySummary;
  owner: string | AgreementPartySummary;
  terms: AgreementTerms;
  pdfUrl: string;
  status: AgreementStatus;
  tenantSignedAt?: string;
  ownerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgreementPayload {
  applicationId: string;
}
