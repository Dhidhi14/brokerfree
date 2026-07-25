import { apiClient, apiDelete, apiGet, apiPatch } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  NearbyProperty,
  NearbySearchParams,
  PendingProperty,
  Property,
  PropertyListFilters,
  PropertyListResult,
  VideoVerification,
} from '@/types/property.types';

export interface PropertyData {
  property: Property;
}

export interface PropertiesData {
  properties: Property[];
}

export interface PendingPropertiesData {
  pending: PendingProperty[];
}

export interface ReviewPropertyPayload {
  decision: 'approve' | 'reject';
  rejectionReason?: string;
}

function buildQueryParams(filters: object): string {
  const params = new URLSearchParams();

  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getMyProperties(): Promise<ApiResponse<PropertiesData>> {
  return apiGet<PropertiesData>('/properties/my-properties');
}

export function getProperty(id: string): Promise<ApiResponse<PropertyData>> {
  return apiGet<PropertyData>(`/properties/${id}`);
}

export function listProperties(
  filters: PropertyListFilters = {}
): Promise<ApiResponse<PropertyListResult>> {
  return apiGet<PropertyListResult>(`/properties${buildQueryParams(filters)}`);
}

export function searchNearby(
  params: NearbySearchParams
): Promise<ApiResponse<PropertyListResult & { properties: NearbyProperty[] }>> {
  return apiGet<PropertyListResult & { properties: NearbyProperty[] }>(
    `/properties/near${buildQueryParams(params)}`
  );
}

export async function createProperty(formData: FormData): Promise<ApiResponse<PropertyData>> {
  const response = await apiClient.post<ApiResponse<PropertyData>>('/properties', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
}

export function updateProperty(
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse<PropertyData>> {
  return apiPatch<PropertyData>(`/properties/${id}`, data);
}

export function deleteProperty(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiDelete<{ message: string }>(`/properties/${id}`);
}

export function getPendingProperties(): Promise<ApiResponse<PendingPropertiesData>> {
  return apiGet<PendingPropertiesData>('/properties/pending/review');
}

export function reviewProperty(
  id: string,
  decision: 'approve' | 'reject',
  rejectionReason?: string
): Promise<ApiResponse<PropertyData>> {
  const body: ReviewPropertyPayload = { decision };
  if (decision === 'reject' && rejectionReason) {
    body.rejectionReason = rejectionReason;
  }
  return apiPatch<PropertyData>(`/properties/${id}/review`, body);
}

export interface SubmitVideoTourData {
  propertyId: string;
  videoVerification: VideoVerification;
}

export interface VideoStatusData {
  videoVerification: VideoVerification;
}

export async function submitVideoTour(
  propertyId: string,
  formData: FormData
): Promise<ApiResponse<SubmitVideoTourData>> {
  const response = await apiClient.post<ApiResponse<SubmitVideoTourData>>(
    `/properties/${propertyId}/video-tour`,
    formData,
    {
      headers: { 'Content-Type': undefined },
    }
  );
  return response.data;
}

export function getVideoStatus(
  propertyId: string
): Promise<ApiResponse<VideoStatusData>> {
  return apiGet<VideoStatusData>(`/properties/${propertyId}/video-status`);
}
