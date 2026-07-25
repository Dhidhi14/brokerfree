import { z } from 'zod';
import { ALL_AMENITY_VALUES } from '@/constants/property.constants';
import { FURNISHING_TYPES, PROPERTY_TYPES } from '@/lib/constants';

const amenityEnum = z.enum(ALL_AMENITY_VALUES as [string, ...string[]]);

export const propertyBasicsSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100),
  description: z
    .string()
    .trim()
    .min(50, 'Description must be at least 50 characters')
    .max(1000),
  propertyType: z.enum(PROPERTY_TYPES),
  furnishing: z.enum(FURNISHING_TYPES),
  bathrooms: z
    .number({ error: 'Bathrooms is required' })
    .int()
    .min(1, 'At least 1 bathroom required'),
  area: z.number({ error: 'Area is required' }).positive('Area must be positive'),
  floor: z.number().int().min(0).optional(),
  totalFloors: z.number().int().min(1).optional(),
});

export const propertyLocationSchema = z.object({
  line1: z.string().trim().min(1, 'Address line 1 is required'),
  line2: z.string().trim().optional(),
  locality: z.string().trim().min(1, 'Locality is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  latitude: z
    .number({ error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export const propertyPricingSchema = z.object({
  rent: z.number({ error: 'Rent is required' }).positive('Rent must be positive'),
  deposit: z
    .number({ error: 'Deposit is required' })
    .min(0, 'Deposit cannot be negative'),
  maintenance: z
    .number({ error: 'Maintenance is required' })
    .min(0, 'Maintenance cannot be negative'),
  bachelors: z.boolean(),
  families: z.boolean(),
  workingProfessionals: z.boolean(),
  students: z.boolean(),
  amenities: z.array(amenityEnum),
});
export type PropertyBasicsValues = z.infer<typeof propertyBasicsSchema>;
export type PropertyLocationValues = z.infer<typeof propertyLocationSchema>;
export type PropertyPricingValues = z.infer<typeof propertyPricingSchema>;

export interface PropertyWizardState {
  basics: PropertyBasicsValues;
  location: PropertyLocationValues;
  pricing: PropertyPricingValues;
  photos: File[];
}
