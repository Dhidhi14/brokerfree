import type { FurnishingType, PropertyType } from '@/lib/constants';

export type PropertyStatus =
  | 'draft'
  | 'pending-verification'
  | 'live'
  | 'rented'
  | 'inactive';

export interface PropertyAddress {
  line1: string;
  line2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PropertyLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface PropertyPhoto {
  url: string;
  publicId: string;
  isCover: boolean;
}

export type VideoVerificationStatus =
  | 'not_submitted'
  | 'processing'
  | 'completed'
  | 'failed';

export interface VideoVerificationResult {
  amenity: string;
  claimed: boolean;
  detected: boolean;
  confidence: number;
}

export interface VideoVerification {
  status: VideoVerificationStatus;
  videoUrl?: string;
  videoPublicId?: string;
  frameUrls: string[];
  results: VideoVerificationResult[];
  overallMatchScore?: number;
  flaggedIssues: string[];
  analyzedAt?: string;
  errorMessage?: string;
}

export interface PropertyPreferences {
  bachelors: boolean;
  families: boolean;
  workingProfessionals: boolean;
  students: boolean;
}

export interface PropertyOwnerSummary {
  _id: string;
  fullName: string;
  profilePicture?: string;
  rating: { average: number; count: number };
}

export interface PropertyOwnerAdminSummary {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Property {
  _id: string;
  owner: string | PropertyOwnerSummary;
  title: string;
  description: string;
  propertyType: PropertyType;
  furnishing: FurnishingType;
  bathrooms: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  address: PropertyAddress;
  location: PropertyLocation;
  rent: number;
  deposit: number;
  maintenance: number;
  amenities: string[];
  photos: PropertyPhoto[];
  videoTour?: { url: string; publicId: string };
  videoVerification?: VideoVerification;
  preferences: PropertyPreferences;
  status: PropertyStatus;
  rejectionReason?: string;
  views: number;
  shortlists: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingProperty extends Omit<Property, 'owner'> {
  owner: PropertyOwnerAdminSummary;
}

export type PropertySortBy = 'newest' | 'price-low' | 'price-high' | 'popular';

export interface PropertyListFilters {
  city?: string;
  locality?: string;
  minRent?: number;
  maxRent?: number;
  propertyType?: PropertyType;
  amenities?: string[];
  furnishing?: FurnishingType;
  page?: number;
  limit?: number;
  sortBy?: PropertySortBy;
}

export interface PropertyListResult {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NearbySearchParams extends PropertyListFilters {
  lat: number;
  lng: number;
  radiusKm?: number;
}

export interface NearbyProperty extends Property {
  distanceMeters?: number;
}
