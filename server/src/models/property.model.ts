import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import {
  FURNISHING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '@/constants/property.constants';

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type FurnishingType = (typeof FURNISHING_TYPES)[number];

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export interface IPropertyAddress {
  line1: string;
  line2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IPropertyLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface IPropertyPhoto {
  url: string;
  publicId: string;
  isCover: boolean;
}

export interface IPropertyVideoTour {
  url: string;
  publicId: string;
}

export interface IPropertyPreferences {
  bachelors: boolean;
  families: boolean;
  workingProfessionals: boolean;
  students: boolean;
}

export interface IProperty {
  owner: mongoose.Types.ObjectId;
  title: string;
  description: string;
  propertyType: PropertyType;
  furnishing: FurnishingType;
  bathrooms: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  address: IPropertyAddress;
  location: IPropertyLocation;
  rent: number;
  deposit: number;
  maintenance: number;
  amenities: string[];
  photos: IPropertyPhoto[];
  videoTour?: IPropertyVideoTour;
  preferences: IPropertyPreferences;
  status: PropertyStatus;
  rejectionReason?: string;
  views: number;
  shortlists: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyDocument = HydratedDocument<IProperty>;

const addressSchema = new Schema<IPropertyAddress>(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    locality: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const photoSchema = new Schema<IPropertyPhoto>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isCover: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const videoTourSchema = new Schema<IPropertyVideoTour>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const preferencesSchema = new Schema<IPropertyPreferences>(
  {
    bachelors: { type: Boolean, default: false },
    families: { type: Boolean, default: false },
    workingProfessionals: { type: Boolean, default: false },
    students: { type: Boolean, default: false },
  },
  { _id: false }
);

const propertySchema = new Schema<IProperty>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 50,
      maxlength: 1000,
    },
    propertyType: {
      type: String,
      enum: PROPERTY_TYPES,
      required: true,
    },
    furnishing: {
      type: String,
      enum: FURNISHING_TYPES,
      required: true,
    },
    bathrooms: { type: Number, required: true, min: 1 },
    area: { type: Number, required: true, min: 1 },
    floor: { type: Number, min: 0 },
    totalFloors: { type: Number, min: 1 },
    address: { type: addressSchema, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(value: number[]) {
            return (
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },
    rent: { type: Number, required: true, min: 1 },
    deposit: { type: Number, required: true, min: 0 },
    maintenance: { type: Number, default: 0, min: 0 },
    amenities: { type: [String], default: [] },
    photos: { type: [photoSchema], default: [] },
    videoTour: videoTourSchema,
    preferences: { type: preferencesSchema, required: true },
    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      default: 'draft',
    },
    rejectionReason: { type: String },
    views: { type: Number, default: 0, min: 0 },
    shortlists: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const record = ret as Record<string, unknown>;
        delete record.__v;
        return record;
      },
    },
  }
);

propertySchema.index({ location: '2dsphere' });
propertySchema.index({ 'address.city': 1, 'address.locality': 1, rent: 1 });
propertySchema.index({ owner: 1, status: 1 });
propertySchema.index({ status: 1, createdAt: -1 });

export const Property = mongoose.model<IProperty>('Property', propertySchema);
