import { cloudinary } from '@/config/cloudinary';
import { KYC_CLOUDINARY_FOLDER } from '@/constants/kyc.constants';
import { AppError } from '@/utils/app-error';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

function uploadFromBuffer(
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function uploadDocument(
  fileBuffer: Buffer,
  folder: string = KYC_CLOUDINARY_FOLDER,
  mimetype?: string
): Promise<CloudinaryUploadResult> {
  const resourceType =
    mimetype === 'application/pdf' ? ('raw' as const) : ('image' as const);

  try {
    return await uploadFromBuffer(fileBuffer, folder, resourceType);
  } catch {
    throw new AppError('Failed to upload document', 500, 'UPLOAD_FAILED');
  }
}

export async function deleteDocument(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch {
      throw new AppError('Failed to delete document', 500, 'DELETE_FAILED');
    }
  }
}
