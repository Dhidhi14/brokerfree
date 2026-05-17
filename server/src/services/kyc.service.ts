import mongoose from 'mongoose';
import { AuditLog } from '@/models/audit-log.model';
import { User, type IUserKyc, type UserDocument } from '@/models/user.model';
import * as cloudinaryService from '@/services/cloudinary.service';
import * as kycVerificationService from '@/services/kyc-verification.service';
import { AppError } from '@/utils/app-error';
import type { ReviewKycInput, SubmitKycInput } from '@/validators/kyc.validator';

export interface KycSubmitFiles {
  aadhaarDoc: Express.Multer.File;
  panDoc: Express.Multer.File;
}

export interface PendingKycUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  kyc: IUserKyc;
  submittedAt?: Date;
}

function last4(value: string): string {
  return value.slice(-4);
}

function assertOwner(user: UserDocument): void {
  if (user.role !== 'owner') {
    throw new AppError('Only owners can submit KYC', 403, 'FORBIDDEN');
  }
}

async function deleteKycDocuments(publicIds: string[]): Promise<void> {
  await Promise.all(publicIds.map((id) => cloudinaryService.deleteDocument(id)));
}

export async function submitKyc(
  userId: string,
  data: SubmitKycInput,
  files: KycSubmitFiles
): Promise<IUserKyc> {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  assertOwner(user);

  const status = user.kyc?.status ?? 'not_submitted';

  if (status === 'verified') {
    throw new AppError('KYC is already verified', 409, 'KYC_ALREADY_VERIFIED');
  }

  if (status === 'pending') {
    throw new AppError('KYC submission is already under review', 409, 'KYC_ALREADY_PENDING');
  }

  if (status !== 'not_submitted' && status !== 'rejected') {
    throw new AppError('KYC cannot be submitted in the current state', 409, 'KYC_INVALID_STATE');
  }

  const previousPublicIds = user.kyc?.documents?.map((doc) => doc.publicId) ?? [];

  let aadhaarUpload: cloudinaryService.CloudinaryUploadResult | undefined;
  let panUpload: cloudinaryService.CloudinaryUploadResult | undefined;

  try {
    [aadhaarUpload, panUpload] = await Promise.all([
      cloudinaryService.uploadDocument(
        files.aadhaarDoc.buffer,
        undefined,
        files.aadhaarDoc.mimetype
      ),
      cloudinaryService.uploadDocument(files.panDoc.buffer, undefined, files.panDoc.mimetype),
    ]);

    const [aadhaarResult, panResult] = await Promise.all([
      kycVerificationService.verifyAadhaar(data.aadhaarNumber),
      kycVerificationService.verifyPan(data.panNumber),
    ]);

    if (!aadhaarResult.verified || !panResult.verified) {
      const reasons: string[] = [];
      if (!aadhaarResult.verified) {
        reasons.push('Aadhaar verification failed');
      }
      if (!panResult.verified) {
        reasons.push('PAN verification failed');
      }
      throw new AppError(reasons.join('. '), 400, 'KYC_VERIFICATION_FAILED');
    }

    const now = new Date();
    const documents = [
      {
        type: 'aadhaar' as const,
        url: aadhaarUpload.url,
        publicId: aadhaarUpload.publicId,
        uploadedAt: now,
      },
      {
        type: 'pan' as const,
        url: panUpload.url,
        publicId: panUpload.publicId,
        uploadedAt: now,
      },
    ];

    user.kyc = {
      status: 'pending',
      documents,
      submittedAt: now,
      aadhaarLast4: last4(data.aadhaarNumber),
      panLast4: last4(data.panNumber.toUpperCase()),
      reviewedAt: undefined,
      reviewedBy: undefined,
      rejectionReason: undefined,
    };

    user.ownerVerificationStatus = 'pending';
    await user.save();

    if (previousPublicIds.length > 0) {
      await deleteKycDocuments(previousPublicIds).catch(() => undefined);
    }

    return user.kyc;
  } catch (error) {
    const uploadsToRemove = [aadhaarUpload?.publicId, panUpload?.publicId].filter(
      (id): id is string => Boolean(id)
    );
    if (uploadsToRemove.length > 0) {
      await deleteKycDocuments(uploadsToRemove).catch(() => undefined);
    }
    throw error;
  }
}

export async function getKycStatus(userId: string): Promise<IUserKyc> {
  const user = await User.findById(userId).select('kyc');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user.kyc ?? { status: 'not_submitted', documents: [] };
}

export async function listPendingKyc(): Promise<PendingKycUser[]> {
  const users = await User.find({
    role: 'owner',
    'kyc.status': 'pending',
  })
    .select('fullName email phone kyc')
    .sort({ 'kyc.submittedAt': 1 });

  return users.map((user) => ({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    kyc: user.kyc,
    submittedAt: user.kyc.submittedAt,
  }));
}

export async function reviewKyc(
  adminId: string,
  targetUserId: string,
  input: ReviewKycInput
): Promise<IUserKyc> {
  const user = await User.findById(targetUserId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.role !== 'owner') {
    throw new AppError('KYC review is only applicable to owners', 400, 'INVALID_TARGET');
  }

  if (user.kyc?.status !== 'pending') {
    throw new AppError('No pending KYC submission for this user', 400, 'KYC_NOT_PENDING');
  }

  const previousStatus = user.kyc.status;
  const now = new Date();

  if (input.decision === 'approve') {
    user.kyc.status = 'verified';
    user.kyc.reviewedAt = now;
    user.kyc.reviewedBy = new mongoose.Types.ObjectId(adminId);
    user.kyc.rejectionReason = undefined;
    user.ownerVerificationStatus = 'verified';
    user.isAadhaarVerified = true;
    if (user.kyc.aadhaarLast4) {
      user.aadhaarLastFour = user.kyc.aadhaarLast4;
    }

    await user.save();

    await AuditLog.create({
      action: 'kyc.approved',
      performedBy: adminId,
      targetUser: targetUserId,
      details: { decision: 'approve', previousStatus },
    });
  } else {
    user.kyc.status = 'rejected';
    user.kyc.reviewedAt = now;
    user.kyc.reviewedBy = new mongoose.Types.ObjectId(adminId);
    user.kyc.rejectionReason = input.rejectionReason;
    user.ownerVerificationStatus = 'rejected';

    await user.save();

    await AuditLog.create({
      action: 'kyc.rejected',
      performedBy: adminId,
      targetUser: targetUserId,
      details: {
        decision: 'reject',
        previousStatus,
        rejectionReason: input.rejectionReason,
      },
    });
  }

  return user.kyc;
}
