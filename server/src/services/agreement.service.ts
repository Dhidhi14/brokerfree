import mongoose from 'mongoose';
import {
  AGREEMENT_CLOUDINARY_FOLDER,
  DEFAULT_LEASE_DURATION_MONTHS,
  DEFAULT_NOTICE_PERIOD_DAYS,
} from '@/constants/agreement.constants';
import {
  Agreement,
  type AgreementDocument,
  type IAgreement,
} from '@/models/agreement.model';
import { Application } from '@/models/application.model';
import type { IPropertyAddress } from '@/models/property.model';
import { generateAgreementPdf } from '@/services/agreement-pdf.service';
import { uploadDocument } from '@/services/cloudinary.service';
import { AppError } from '@/utils/app-error';

interface PopulatedParty {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
}

interface PopulatedProperty {
  _id: mongoose.Types.ObjectId;
  address: IPropertyAddress;
  rent: number;
  deposit: number;
  maintenance: number;
}

function refIdToString(value: unknown): string {
  if (value !== null && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function assertParticipant(agreement: {
  tenant: unknown;
  owner: unknown;
}, userId: string): { isTenant: boolean; isOwner: boolean } {
  const isTenant = refIdToString(agreement.tenant) === userId;
  const isOwner = refIdToString(agreement.owner) === userId;

  if (!isTenant && !isOwner) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  return { isTenant, isOwner };
}

async function findAgreementOrThrow(agreementId: string): Promise<AgreementDocument> {
  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  const agreement = await Agreement.findById(agreementId);

  if (!agreement) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  return agreement;
}

async function populateAgreement(agreementId: string): Promise<IAgreement> {
  const agreement = await Agreement.findById(agreementId)
    .populate({
      path: 'property',
      select: 'title address rent deposit maintenance',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone email',
    })
    .populate({
      path: 'owner',
      select: 'fullName phone email',
    })
    .populate({
      path: 'application',
      select: 'status moveInDate',
    })
    .lean();

  if (!agreement) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  return agreement as unknown as IAgreement;
}

/**
 * Creates a rental agreement for an accepted application, or returns the existing one.
 */
export async function createAgreement(
  requesterId: string,
  applicationId: string
): Promise<IAgreement> {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  const existing = await Agreement.findOne({ application: applicationId });
  if (existing) {
    assertParticipant(existing, requesterId);
    return populateAgreement(existing._id.toString());
  }

  const application = await Application.findById(applicationId)
    .populate<{ property: PopulatedProperty | null }>('property')
    .populate<{ tenant: PopulatedParty | null }>('tenant')
    .populate<{ owner: PopulatedParty | null }>('owner');

  if (!application) {
    throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
  }

  if (application.status !== 'accepted') {
    throw new AppError(
      'Agreements can only be created for accepted applications',
      400,
      'APPLICATION_NOT_ACCEPTED'
    );
  }

  const isTenant = application.tenant && refIdToString(application.tenant) === requesterId;
  const isOwner = application.owner && refIdToString(application.owner) === requesterId;

  if (!isTenant && !isOwner) {
    throw new AppError(
      'Only the tenant or owner on this application can create an agreement',
      403,
      'FORBIDDEN'
    );
  }

  const property = application.property;
  const tenant = application.tenant;
  const owner = application.owner;

  if (!property || !tenant || !owner) {
    throw new AppError(
      'Application is missing property or party details',
      500,
      'AGREEMENT_DATA_INCOMPLETE'
    );
  }

  const terms = {
    rent: property.rent,
    deposit: property.deposit,
    maintenance: property.maintenance ?? 0,
    moveInDate: application.moveInDate,
    leaseDurationMonths: DEFAULT_LEASE_DURATION_MONTHS,
    noticePeriodDays: DEFAULT_NOTICE_PERIOD_DAYS,
  };

  const pdfBuffer = await generateAgreementPdf({
    propertyAddress: property.address,
    owner: {
      fullName: owner.fullName,
      phone: owner.phone,
    },
    tenant: {
      fullName: tenant.fullName,
      phone: tenant.phone,
    },
    terms,
  });

  const uploaded = await uploadDocument(
    pdfBuffer,
    AGREEMENT_CLOUDINARY_FOLDER,
    'application/pdf'
  );

  try {
    const agreement = await Agreement.create({
      application: application._id,
      property: property._id,
      tenant: tenant._id,
      owner: owner._id,
      terms,
      pdfUrl: uploaded.url,
      pdfPublicId: uploaded.publicId,
      status: 'pending-signatures',
    });

    return populateAgreement(agreement._id.toString());
  } catch (error: unknown) {
    // Race: another request created the agreement first
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      const raced = await Agreement.findOne({ application: applicationId });
      if (raced) {
        assertParticipant(raced, requesterId);
        return populateAgreement(raced._id.toString());
      }
    }
    throw error;
  }
}

/**
 * Returns an agreement if the viewer is the tenant or owner on it.
 */
export async function getAgreement(
  agreementId: string,
  viewerId: string
): Promise<IAgreement> {
  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  const agreement = await Agreement.findById(agreementId).lean();

  if (!agreement) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  assertParticipant(agreement, viewerId);
  return populateAgreement(agreementId);
}

/**
 * Returns all agreements where the user is tenant or owner.
 */
export async function getMyAgreements(userId: string): Promise<IAgreement[]> {
  const agreements = await Agreement.find({
    $or: [{ tenant: userId }, { owner: userId }],
  })
    .populate({
      path: 'property',
      select: 'title address rent deposit maintenance',
    })
    .populate({
      path: 'tenant',
      select: 'fullName phone email',
    })
    .populate({
      path: 'owner',
      select: 'fullName phone email',
    })
    .sort({ createdAt: -1 })
    .lean();

  return agreements as unknown as IAgreement[];
}

/**
 * Records a digital signature for the tenant or owner; executes when both have signed.
 */
export async function signAgreement(
  userId: string,
  agreementId: string
): Promise<IAgreement> {
  const agreement = await findAgreementOrThrow(agreementId);
  const { isTenant, isOwner } = assertParticipant(agreement, userId);

  if (agreement.status === 'executed') {
    throw new AppError(
      'This agreement has already been executed',
      400,
      'AGREEMENT_ALREADY_EXECUTED'
    );
  }

  if (isTenant) {
    if (agreement.tenantSignedAt) {
      throw new AppError(
        'You have already signed this agreement',
        400,
        'ALREADY_SIGNED'
      );
    }
    agreement.tenantSignedAt = new Date();
  }

  if (isOwner) {
    if (agreement.ownerSignedAt) {
      throw new AppError(
        'You have already signed this agreement',
        400,
        'ALREADY_SIGNED'
      );
    }
    agreement.ownerSignedAt = new Date();
  }

  if (agreement.tenantSignedAt && agreement.ownerSignedAt) {
    agreement.status = 'executed';
  } else {
    agreement.status = 'pending-signatures';
  }

  await agreement.save();
  return populateAgreement(agreement._id.toString());
}
