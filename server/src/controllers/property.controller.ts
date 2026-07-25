import type { Request, Response } from 'express';
import * as propertyService from '@/services/property.service';
import { AppError } from '@/utils/app-error';
import {
  createPropertySchema,
  type CreatePropertyInput,
  type NearbySearchInput,
  type SearchPropertyInput,
  type UpdatePropertyInput,
} from '@/validators/property.validator';

function parseJsonField<T>(value: unknown, fieldName: string): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      throw new AppError(`Invalid JSON for ${fieldName}`, 400, 'INVALID_JSON');
    }
  }

  return value as T;
}

function normalizeCreateBody(body: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...body };

  if (body.address !== undefined) {
    normalized.address = parseJsonField(body.address, 'address');
  }

  if (body.location !== undefined) {
    normalized.location = parseJsonField(body.location, 'location');
  }

  if (body.preferences !== undefined) {
    normalized.preferences = parseJsonField(body.preferences, 'preferences');
  }

  if (body.amenities !== undefined) {
    normalized.amenities =
      typeof body.amenities === 'string'
        ? parseJsonField<string[]>(body.amenities, 'amenities')
        : body.amenities;
  }

  return normalized;
}

function getPhotoFiles(req: Request): Express.Multer.File[] {
  const files = req.files;

  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError('At least one photo is required', 400, 'MISSING_PHOTOS');
  }

  return files;
}

export async function createProperty(req: Request, res: Response): Promise<void> {
  const normalizedBody = normalizeCreateBody(req.body as Record<string, unknown>);
  const parsed = createPropertySchema.safeParse(normalizedBody);

  if (!parsed.success) {
    throw parsed.error;
  }

  const property = await propertyService.createProperty(
    req.user!.id,
    parsed.data as CreatePropertyInput,
    getPhotoFiles(req)
  );

  res.status(201).json({
    success: true,
    data: { property },
  });
}

export async function getProperty(req: Request, res: Response): Promise<void> {
  const viewerId = req.user?.id;
  const property = await propertyService.getPropertyById(req.params.id as string, viewerId);

  res.status(200).json({
    success: true,
    data: { property },
  });
}

export async function listProperties(req: Request, res: Response): Promise<void> {
  const result = await propertyService.listProperties(
    req.query as unknown as SearchPropertyInput
  );

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
  });
}

export async function searchNearby(req: Request, res: Response): Promise<void> {
  const result = await propertyService.searchNearby(req.query as unknown as NearbySearchInput);

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
  });
}

export async function getMyProperties(req: Request, res: Response): Promise<void> {
  const properties = await propertyService.getMyProperties(req.user!.id);

  res.status(200).json({
    success: true,
    data: { properties },
  });
}

export async function updateProperty(req: Request, res: Response): Promise<void> {
  const property = await propertyService.updateProperty(
    req.params.id as string,
    req.user!.id,
    req.body as UpdatePropertyInput
  );

  res.status(200).json({
    success: true,
    data: { property },
  });
}

export async function deleteProperty(req: Request, res: Response): Promise<void> {
  await propertyService.deleteProperty(req.params.id as string, req.user!.id);

  res.status(200).json({
    success: true,
    data: { message: 'Property deleted successfully' },
  });
}
