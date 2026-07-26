import type { CreatePropertyInput } from '@/validators/property.validator';
import { Property } from '@/models/property.model';
import { User } from '@/models/user.model';

export const TEST_PASSWORD = 'Password1';

export function fakePhotoFile(
  overrides: Partial<Express.Multer.File> = {}
): Express.Multer.File {
  return {
    fieldname: 'photos',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 128,
    buffer: Buffer.from('fake-image-bytes'),
    stream: undefined as unknown as Express.Multer.File['stream'],
    destination: '',
    filename: 'photo.jpg',
    path: '',
    ...overrides,
  };
}

export const samplePropertyInput: CreatePropertyInput = {
  title: 'Spacious 2BHK near metro',
  description:
    'Bright apartment with balcony, covered parking, and 24x7 water supply in a quiet locality.',
  propertyType: '2BHK',
  furnishing: 'semi-furnished',
  bathrooms: 2,
  area: 950,
  floor: 3,
  totalFloors: 8,
  address: {
    line1: '12 MG Road',
    locality: 'Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
  },
  location: {
    type: 'Point',
    coordinates: [77.5946, 12.9716],
  },
  rent: 28000,
  deposit: 56000,
  maintenance: 2500,
  amenities: ['parking', 'lift'],
  preferences: {
    bachelors: true,
    families: true,
    workingProfessionals: true,
    students: false,
  },
};

export async function createUser(opts: {
  email: string;
  phone: string;
  role?: 'tenant' | 'owner' | 'admin';
  fullName?: string;
  password?: string;
  kycStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  ownerVerificationStatus?: 'pending' | 'verified' | 'rejected';
}) {
  const user = new User({
    email: opts.email,
    phone: opts.phone,
    fullName: opts.fullName ?? 'Test User',
    role: opts.role ?? 'tenant',
    password: opts.password ?? TEST_PASSWORD,
    kyc: {
      status: opts.kycStatus ?? 'not_submitted',
      documents: [],
    },
    ownerVerificationStatus: opts.ownerVerificationStatus,
  });
  await user.save();
  return user;
}

export async function createPropertyDoc(
  ownerId: string,
  overrides: Record<string, unknown> = {}
) {
  return Property.create({
    owner: ownerId,
    title: samplePropertyInput.title,
    description: samplePropertyInput.description,
    propertyType: samplePropertyInput.propertyType,
    furnishing: samplePropertyInput.furnishing,
    bathrooms: samplePropertyInput.bathrooms,
    area: samplePropertyInput.area,
    address: samplePropertyInput.address,
    location: samplePropertyInput.location,
    rent: samplePropertyInput.rent,
    deposit: samplePropertyInput.deposit,
    maintenance: samplePropertyInput.maintenance,
    amenities: samplePropertyInput.amenities,
    photos: [
      {
        url: 'https://example.com/photo.jpg',
        publicId: 'brokerfree/properties/photo',
        isCover: true,
      },
    ],
    preferences: samplePropertyInput.preferences,
    status: 'live',
    ...overrides,
  });
}
