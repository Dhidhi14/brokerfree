import mongoose, { type SortOrder } from 'mongoose';
import { PROPERTY_CLOUDINARY_FOLDER } from '@/constants/property.constants';
import { Property, type IProperty, type PropertyDocument } from '@/models/property.model';
import { User, type UserDocument } from '@/models/user.model';
import * as cloudinaryService from '@/services/cloudinary.service';
import { AppError } from '@/utils/app-error';
import type {
  CreatePropertyInput,
  NearbySearchInput,
  SearchPropertyInput,
  UpdatePropertyInput,
} from '@/validators/property.validator';

const OWNER_PUBLIC_FIELDS = 'fullName profilePicture rating';

export interface PropertyListResult {
  properties: IProperty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NearbyProperty extends IProperty {
  distanceMeters: number;
}

function isVerifiedOwner(user: UserDocument): boolean {
  return user.kyc?.status === 'verified' || user.ownerVerificationStatus === 'verified';
}

type PropertyFilter = Record<string, unknown>;

function buildFilterQuery(
  filters: Pick<
    SearchPropertyInput,
    'city' | 'locality' | 'minRent' | 'maxRent' | 'propertyType' | 'amenities' | 'furnishing'
  >
): PropertyFilter {
  const query: PropertyFilter = { status: 'live' };

  if (filters.city) {
    query['address.city'] = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
  }

  if (filters.locality) {
    query['address.locality'] = new RegExp(escapeRegex(filters.locality), 'i');
  }

  if (filters.propertyType) {
    query.propertyType = filters.propertyType;
  }

  if (filters.furnishing) {
    query.furnishing = filters.furnishing;
  }

  if (filters.amenities?.length) {
    query.amenities = { $all: filters.amenities };
  }

  if (filters.minRent !== undefined || filters.maxRent !== undefined) {
    const rentFilter: Record<string, number> = {};
    if (filters.minRent !== undefined) {
      rentFilter.$gte = filters.minRent;
    }
    if (filters.maxRent !== undefined) {
      rentFilter.$lte = filters.maxRent;
    }
    query.rent = rentFilter;
  }

  return query;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSortOption(sortBy: SearchPropertyInput['sortBy']): Record<string, SortOrder> {
  switch (sortBy) {
    case 'price-low':
      return { rent: 1 };
    case 'price-high':
      return { rent: -1 };
    case 'popular':
      return { shortlists: -1, views: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

async function assertPropertyOwner(
  propertyId: string,
  ownerId: string
): Promise<PropertyDocument> {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const property = await Property.findById(propertyId);

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  if (property.owner.toString() !== ownerId) {
    throw new AppError('You do not own this property', 403, 'FORBIDDEN');
  }

  return property;
}

export async function createProperty(
  ownerId: string,
  data: CreatePropertyInput,
  photoFiles: Express.Multer.File[]
): Promise<IProperty> {
  if (!photoFiles.length) {
    throw new AppError('At least one photo is required', 400, 'MISSING_PHOTOS');
  }

  const owner = await User.findById(ownerId);

  if (!owner) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (owner.role !== 'owner') {
    throw new AppError('Only owners can create properties', 403, 'FORBIDDEN');
  }

  if (!isVerifiedOwner(owner)) {
    throw new AppError('Owner must complete KYC verification', 403, 'OWNER_NOT_VERIFIED');
  }

  const uploadedPhotos = await Promise.all(
    photoFiles.map((file) =>
      cloudinaryService.uploadDocument(file.buffer, PROPERTY_CLOUDINARY_FOLDER, file.mimetype)
    )
  );

  const photos = uploadedPhotos.map((upload, index) => ({
    url: upload.url,
    publicId: upload.publicId,
    isCover: index === 0,
  }));

  const property = await Property.create({
    ...data,
    owner: ownerId,
    photos,
    status: 'pending-verification',
  });

  return property.toObject();
}

export async function getPropertyById(
  propertyId: string,
  viewerId?: string
): Promise<IProperty> {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const property = await Property.findById(propertyId);

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const isOwner = viewerId !== undefined && property.owner.toString() === viewerId;

  if (property.status !== 'live' && !isOwner) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  await property.populate({ path: 'owner', select: OWNER_PUBLIC_FIELDS });

  if (viewerId && !isOwner) {
    void Property.updateOne({ _id: property._id }, { $inc: { views: 1 } }).exec();
  }

  return property.toObject();
}

export async function listProperties(
  filters: SearchPropertyInput
): Promise<PropertyListResult> {
  const query = buildFilterQuery(filters);
  const sort = getSortOption(filters.sortBy);
  const page = filters.page;
  const limit = filters.limit;
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'owner', select: OWNER_PUBLIC_FIELDS })
      .lean(),
    Property.countDocuments(query),
  ]);

  return {
    properties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function searchNearby(
  params: NearbySearchInput
): Promise<PropertyListResult & { properties: NearbyProperty[] }> {
  const { lat, lng, radiusKm, page, limit, ...filterFields } = params;
  const query = buildFilterQuery(filterFields);
  const skip = (page - 1) * limit;

  const pipeline: mongoose.PipelineStage[] = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: radiusKm * 1000,
        spherical: true,
        key: 'location',
        query,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [{ $project: { fullName: 1, profilePicture: 1, rating: 1 } }],
      },
    },
    { $unwind: '$owner' },
    { $sort: { distanceMeters: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Property.aggregate<{
    data: NearbyProperty[];
    totalCount: Array<{ count: number }>;
  }>(pipeline);

  const total = result?.totalCount[0]?.count ?? 0;

  return {
    properties: result?.data ?? [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getMyProperties(ownerId: string): Promise<IProperty[]> {
  const properties = await Property.find({ owner: ownerId })
    .sort({ createdAt: -1 })
    .populate({ path: 'owner', select: OWNER_PUBLIC_FIELDS })
    .lean();

  return properties;
}

export async function updateProperty(
  propertyId: string,
  ownerId: string,
  data: UpdatePropertyInput
): Promise<IProperty> {
  const existing = await assertPropertyOwner(propertyId, ownerId);

  const updatePayload: Record<string, unknown> = { ...data };

  if (data.address) {
    updatePayload.address = { ...existing.address, ...data.address };
  }

  if (data.preferences) {
    updatePayload.preferences = { ...existing.preferences, ...data.preferences };
  }

  const property = await Property.findByIdAndUpdate(
    propertyId,
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).populate({ path: 'owner', select: OWNER_PUBLIC_FIELDS });

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  return property.toObject();
}

export async function deleteProperty(propertyId: string, ownerId: string): Promise<void> {
  const property = await assertPropertyOwner(propertyId, ownerId);

  const publicIds = [
    ...property.photos.map((photo) => photo.publicId),
    ...(property.videoTour ? [property.videoTour.publicId] : []),
  ];

  await Promise.all(publicIds.map((publicId) => cloudinaryService.deleteDocument(publicId)));
  await Property.findByIdAndDelete(propertyId);
}
