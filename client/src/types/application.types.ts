export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface ApplicationPropertySummary {
  _id: string;
  title: string;
  photos?: Array<{ url: string; publicId: string; isCover: boolean }>;
  address?: { city: string };
  rent?: number;
  status?: string;
}

export interface ApplicationTenantSummary {
  _id: string;
  fullName: string;
  phone: string;
  rating: { average: number; count: number };
}

export interface Application {
  _id: string;
  property: string | ApplicationPropertySummary;
  tenant: string | ApplicationTenantSummary;
  owner: string;
  message: string;
  moveInDate: string;
  occupants: number;
  status: ApplicationStatus;
  ownerResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationPayload {
  propertyId: string;
  message: string;
  moveInDate: string;
  occupants: number;
}

export interface RespondApplicationPayload {
  decision: 'accept' | 'reject';
  ownerResponse?: string;
}

export interface ReceivedApplicationsFilters {
  status?: ApplicationStatus;
  propertyId?: string;
}
