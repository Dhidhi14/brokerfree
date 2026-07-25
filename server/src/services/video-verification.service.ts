import mongoose from 'mongoose';
import {
  PROPERTY_FRAME_CLOUDINARY_FOLDER,
  PROPERTY_VIDEO_CLOUDINARY_FOLDER,
} from '@/constants/property.constants';
import {
  Property,
  type IVideoVerification,
  type IVideoVerificationResult,
} from '@/models/property.model';
import type { UserRole } from '@/models/user.model';
import * as cloudinaryService from '@/services/cloudinary.service';
import { extractFrames } from '@/services/frame-extraction.service';
import { analyzeVideoFrames } from '@/services/video-analysis.service';
import { AppError } from '@/utils/app-error';
import { logger } from '@/utils/logger';

export interface SubmitVideoVerificationResult {
  propertyId: string;
  videoVerification: IVideoVerification;
}

function toVerificationObject(value: IVideoVerification): IVideoVerification {
  return {
    status: value.status,
    videoUrl: value.videoUrl,
    videoPublicId: value.videoPublicId,
    frameUrls: [...(value.frameUrls ?? [])],
    results: (value.results ?? []).map((result) => ({
      amenity: result.amenity,
      claimed: result.claimed,
      detected: result.detected,
      confidence: result.confidence,
    })),
    overallMatchScore: value.overallMatchScore,
    flaggedIssues: [...(value.flaggedIssues ?? [])],
    analyzedAt: value.analyzedAt,
    errorMessage: value.errorMessage,
  };
}

async function markVerificationFailed(
  propertyId: string,
  errorMessage: string
): Promise<void> {
  await Property.findByIdAndUpdate(propertyId, {
    $set: {
      'videoVerification.status': 'failed',
      'videoVerification.errorMessage': errorMessage,
      'videoVerification.analyzedAt': new Date(),
    },
  });
}

async function processVideoVerification(
  propertyId: string,
  videoBuffer: Buffer,
  claimedAmenities: string[]
): Promise<void> {
  try {
    const frameBuffers = await extractFrames(videoBuffer, 6);

    const uploadedFrames = await Promise.all(
      frameBuffers.map((frameBuffer) =>
        cloudinaryService.uploadImage(frameBuffer, PROPERTY_FRAME_CLOUDINARY_FOLDER)
      )
    );

    const frameUrls = uploadedFrames.map((frame) => frame.url);
    const { results: analysisResults } = await analyzeVideoFrames(
      frameUrls,
      claimedAmenities
    );

    const results: IVideoVerificationResult[] = analysisResults.map((result) => ({
      amenity: result.amenity,
      claimed: true,
      detected: result.detected,
      confidence: result.confidence,
    }));

    const claimedCount = claimedAmenities.length;
    const detectedCount = results.filter((result) => result.detected).length;
    const overallMatchScore =
      claimedCount === 0 ? 100 : Math.round((detectedCount / claimedCount) * 100);

    const flaggedIssues = results
      .filter((result) => !result.detected)
      .map(
        (result) =>
          `Claimed amenity "${result.amenity}" was not clearly visible in the video tour`
      );

    await Property.findByIdAndUpdate(propertyId, {
      $set: {
        'videoVerification.status': 'completed',
        'videoVerification.frameUrls': frameUrls,
        'videoVerification.results': results,
        'videoVerification.overallMatchScore': overallMatchScore,
        'videoVerification.flaggedIssues': flaggedIssues,
        'videoVerification.analyzedAt': new Date(),
      },
      $unset: {
        'videoVerification.errorMessage': '',
      },
    });
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Video verification failed';

    logger.error('Video verification background job failed', {
      propertyId,
      error: message,
    });

    await markVerificationFailed(propertyId, message);
  }
}

export async function submitVideoForVerification(
  propertyId: string,
  ownerId: string,
  videoBuffer: Buffer
): Promise<SubmitVideoVerificationResult> {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  if (!videoBuffer.length) {
    throw new AppError('Video file is required', 400, 'MISSING_VIDEO');
  }

  const property = await Property.findById(propertyId);

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  if (property.owner.toString() !== ownerId) {
    throw new AppError('You do not own this property', 403, 'FORBIDDEN');
  }

  const uploadedVideo = await cloudinaryService.uploadVideo(
    videoBuffer,
    PROPERTY_VIDEO_CLOUDINARY_FOLDER
  );

  property.videoTour = {
    url: uploadedVideo.url,
    publicId: uploadedVideo.publicId,
  };

  property.videoVerification = {
    status: 'processing',
    videoUrl: uploadedVideo.url,
    videoPublicId: uploadedVideo.publicId,
    frameUrls: [],
    results: [],
    flaggedIssues: [],
    overallMatchScore: undefined,
    analyzedAt: undefined,
    errorMessage: undefined,
  };

  await property.save();

  const claimedAmenities = [...property.amenities];

  void processVideoVerification(propertyId, videoBuffer, claimedAmenities);

  return {
    propertyId: property.id,
    videoVerification: toVerificationObject(property.videoVerification),
  };
}

export async function getVideoVerificationStatus(
  propertyId: string,
  requesterId: string,
  requesterRole: UserRole
): Promise<IVideoVerification> {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const property = await Property.findById(propertyId).select('owner videoVerification');

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const isOwner = property.owner.toString() === requesterId;
  const isAdmin = requesterRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  }

  return toVerificationObject(
    property.videoVerification ?? {
      status: 'not_submitted',
      frameUrls: [],
      results: [],
      flaggedIssues: [],
    }
  );
}
