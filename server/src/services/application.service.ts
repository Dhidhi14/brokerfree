import mongoose from 'mongoose';
import { ACTIVE_APPLICATION_STATUSES } from '@/constants/application.constants';
import {
  Application,
  type ApplicationDocument,
  type IApplication,
} from '@/models/application.model';
import { Property } from '@/models/property.model';
import { AppError } from '@/utils/app-error';
import type {
  CreateApplicationInput,
  ReceivedApplicationsQuery,
  RespondApplicationInput,
} from '@/validators/application.validator';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}

function refIdToString(value: unknown): string {
  if (value !== null && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

async function findApplicationOrThrow(applicationId: string): Promise<ApplicationDocument> {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  const application = await Application.findById(applicationId);

  if (!application) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  return application;
}

export async function createApplication(
  tenantId: string,
  data: CreateApplicationInput
): Promise<IApplication> {
  const property = await Property.findById(data.propertyId);

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  if (property.status !== 'live') {
    throw new AppError(
      'You can only apply to live properties',
      400,
      'PROPERTY_NOT_LIVE'
    );
  }

  if (property.owner.toString() === tenantId) {
    throw new AppError(
      'You cannot apply to your own property',
      400,
      'CANNOT_APPLY_OWN_PROPERTY'
    );
  }

  const existing = await Application.findOne({
    property: data.propertyId,
    tenant: tenantId,
    status: { $in: [...ACTIVE_APPLICATION_STATUSES] },
  });

  if (existing) {
    throw new AppError(
      'You already have an active application for this property',
      409,
      'APPLICATION_EXISTS'
    );
  }

  try {
    const application = await Application.create({
      property: data.propertyId,
      tenant: tenantId,
      owner: property.owner,
      message: data.message,
      moveInDate: data.moveInDate,
      occupants: data.occupants,
      status: 'pending',
    });

    return application.toObject();
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        'You already have an active application for this property',
        409,
        'APPLICATION_EXISTS'
      );
    }
    throw error;
  }
}

export async function getMyApplications(tenantId: string): Promise<IApplication[]> {
  const applications = await Application.find({ tenant: tenantId })
    .populate({
      path: 'property',
      select: 'title photos address.city rent',
    })
    .sort({ createdAt: -1 })
    .lean();

  return applications as unknown as IApplication[];
}

export async function getReceivedApplications(
  ownerId: string,
  filters: ReceivedApplicationsQuery = {}
): Promise<IApplication[]> {
  const query: Record<string, unknown> = { owner: ownerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.propertyId) {
    query.property = filters.propertyId;
  }

  const applications = await Application.find(query)
    .populate({
      path: 'property',
      select: 'title',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone rating',
    })
    .sort({ createdAt: -1 })
    .lean();

  return applications as unknown as IApplication[];
}

export async function getApplicationById(
  applicationId: string,
  viewerId: string
): Promise<IApplication> {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  const application = await Application.findById(applicationId)
    .populate({
      path: 'property',
      select: 'title photos address.city rent status',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone rating',
    })
    .lean();

  if (!application) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  const isTenant = refIdToString(application.tenant) === viewerId;
  const isOwner = refIdToString(application.owner) === viewerId;

  if (!isTenant && !isOwner) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  return application as unknown as IApplication;
}

export async function respondToApplication(
  ownerId: string,
  applicationId: string,
  data: RespondApplicationInput
): Promise<IApplication> {
  const application = await findApplicationOrThrow(applicationId);

  if (application.owner.toString() !== ownerId) {
    throw new AppError(
      'You can only respond to applications for your properties',
      403,
      'FORBIDDEN'
    );
  }

  if (application.status !== 'pending') {
    throw new AppError(
      'Only pending applications can be accepted or rejected',
      400,
      'APPLICATION_NOT_PENDING'
    );
  }

  application.status = data.decision === 'accept' ? 'accepted' : 'rejected';
  application.respondedAt = new Date();

  if (data.ownerResponse) {
    application.ownerResponse = data.ownerResponse;
  }

  await application.save();

  return application.toObject();
}

export async function withdrawApplication(
  tenantId: string,
  applicationId: string
): Promise<IApplication> {
  const application = await findApplicationOrThrow(applicationId);

  if (application.tenant.toString() !== tenantId) {
    throw new AppError(
      'You can only withdraw your own applications',
      403,
      'FORBIDDEN'
    );
  }

  if (application.status !== 'pending') {
    throw new AppError(
      'Only pending applications can be withdrawn',
      400,
      'APPLICATION_NOT_PENDING'
    );
  }

  application.status = 'withdrawn';
  await application.save();

  return application.toObject();
}
