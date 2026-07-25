import { z } from 'zod';
import {
  ALL_AMENITIES,
  FURNISHING_TYPES,
  PROPERTY_TYPES,
} from '@/constants/property.constants';

const coordinatesSchema = z
  .tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ])
  .describe('[longitude, latitude]');

const addressSchema = z.object({
  line1: z.string().trim().min(1, 'Address line 1 is required'),
  line2: z.string().trim().optional(),
  locality: z.string().trim().min(1, 'Locality is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
});

const locationSchema = z.object({
  type: z.literal('Point'),
  coordinates: coordinatesSchema,
});

const preferencesSchema = z.object({
  bachelors: z.boolean(),
  families: z.boolean(),
  workingProfessionals: z.boolean(),
  students: z.boolean(),
});

const positiveNumber = z.coerce.number().positive();

const nonNegativeNumber = z.coerce.number().min(0);

export const createPropertySchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(50).max(1000),
  propertyType: z.enum(PROPERTY_TYPES),
  furnishing: z.enum(FURNISHING_TYPES),
  bathrooms: z.coerce.number().int().min(1),
  area: z.coerce.number().positive(),
  floor: z.coerce.number().int().min(0).optional(),
  totalFloors: z.coerce.number().int().min(1).optional(),
  address: addressSchema,
  location: locationSchema,
  rent: positiveNumber,
  deposit: nonNegativeNumber,
  maintenance: nonNegativeNumber.optional().default(0),
  amenities: z
    .array(z.enum(ALL_AMENITIES))
    .optional()
    .default([]),
  preferences: preferencesSchema,
});

export const updatePropertySchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(50).max(1000).optional(),
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    furnishing: z.enum(FURNISHING_TYPES).optional(),
    bathrooms: z.coerce.number().int().min(1).optional(),
    area: z.coerce.number().positive().optional(),
    floor: z.coerce.number().int().min(0).optional(),
    totalFloors: z.coerce.number().int().min(1).optional(),
    address: addressSchema.partial().optional(),
    location: locationSchema.optional(),
    rent: positiveNumber.optional(),
    deposit: nonNegativeNumber.optional(),
    maintenance: nonNegativeNumber.optional(),
    amenities: z.array(z.enum(ALL_AMENITIES)).optional(),
    preferences: preferencesSchema.partial().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const searchPropertySchema = z.object({
  city: z.string().trim().optional(),
  locality: z.string().trim().optional(),
  minRent: z.coerce.number().min(0).optional(),
  maxRent: z.coerce.number().min(0).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const items = Array.isArray(value) ? value : value.split(',');
      return items.map((item) => item.trim()).filter(Boolean);
    })
    .pipe(z.array(z.enum(ALL_AMENITIES)).optional()),
  furnishing: z.enum(FURNISHING_TYPES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  sortBy: z
    .enum(['newest', 'price-low', 'price-high', 'popular'])
    .optional()
    .default('newest'),
});

export const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(50).optional().default(5),
  city: z.string().trim().optional(),
  locality: z.string().trim().optional(),
  minRent: z.coerce.number().min(0).optional(),
  maxRent: z.coerce.number().min(0).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const items = Array.isArray(value) ? value : value.split(',');
      return items.map((item) => item.trim()).filter(Boolean);
    })
    .pipe(z.array(z.enum(ALL_AMENITIES)).optional()),
  furnishing: z.enum(FURNISHING_TYPES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SearchPropertyInput = z.infer<typeof searchPropertySchema>;
export type NearbySearchInput = z.infer<typeof nearbySchema>;

export const reviewPropertySchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    rejectionReason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'reject' && !data.rejectionReason?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Rejection reason is required when rejecting',
        path: ['rejectionReason'],
      });
    }
  });

export type ReviewPropertyInput = z.infer<typeof reviewPropertySchema>;
