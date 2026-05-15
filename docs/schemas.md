# BrokerFree Database Schemas

All schemas use MongoDB via Mongoose. Every schema has:
- TypeScript interface (exported)
- Mongoose model (exported)
- timestamps: true
- Appropriate indexes

## User Schema

```typescript
interface IUser {
  _id: ObjectId;
  email: string;              // unique, indexed, lowercase
  phone: string;              // unique, indexed, format: 10 digits
  passwordHash: string;       // bcrypt 10 rounds
  role: 'tenant' | 'owner' | 'admin';  // default: 'tenant'
  fullName: string;
  profilePicture?: string;    // Cloudinary URL
  
  // Verification
  isEmailVerified: boolean;   // default: false
  isPhoneVerified: boolean;   // default: false
  isAadhaarVerified: boolean; // default: false
  aadhaarLastFour?: string;   // never store full Aadhaar
  digiLockerVerifiedAt?: Date;
  
  // Owner-specific (only for role: 'owner')
  ownerVerificationStatus?: 'pending' | 'verified' | 'rejected';
  uploadedDocuments?: Array<{
    type: 'aadhaar' | 'pan' | 'property-deed' | 'electricity-bill';
    url: string;
    uploadedAt: Date;
    verifiedAt?: Date;
  }>;
  
  // Tenant-specific
  tenantProfile?: {
    occupation: string;
    monthlyIncome: number;
    preferredCities: string[];
    budgetRange: { min: number; max: number };
    lifestyle: {
      smoking: boolean;
      drinking: boolean;
      vegetarian: boolean;
      pets: boolean;
    };
  };
  
  // Reputation
  rating: { average: number; count: number };
  
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { email: 1 } unique
// { phone: 1 } unique
// { role: 1, ownerVerificationStatus: 1 }
```

## Property Schema

```typescript
interface IProperty {
  _id: ObjectId;
  owner: ObjectId;  // ref: User
  
  // Basic Info
  title: string;
  description: string;
  propertyType: '1BHK' | '2BHK' | '3BHK' | '4BHK+' | 'Studio' | 'PG' | 'Villa';
  furnishing: 'fully-furnished' | 'semi-furnished' | 'unfurnished';
  bathrooms: number;
  area: number;  // in sq ft
  floor?: number;
  totalFloors?: number;
  
  // Location
  address: {
    line1: string;
    line2?: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];  // [longitude, latitude]
  };
  
  // Pricing
  rent: number;
  deposit: number;
  maintenance: number;
  
  // Amenities
  amenities: string[];  // ['parking', 'lift', 'gym', 'pool', '24x7-water', 'power-backup', 'security']
  
  // Media
  photos: Array<{
    url: string;
    publicId: string;
    isCover: boolean;
  }>;
  videoTour?: {
    url: string;
    publicId: string;
    aiAnalysis?: {
      detectedAmenities: Array<{
        amenity: string;
        detected: boolean;
        confidence: number;
        evidence: string;
      }>;
      mismatchFlags: string[];
      qualityScore: number;
      summary: string;
      analyzedAt: Date;
    };
    analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  };
  
  // Preferences
  preferences: {
    bachelors: boolean;
    families: boolean;
    workingProfessionals: boolean;
    students: boolean;
  };
  discriminationFlags?: string[];  // AI-detected issues
  
  // Status
  status: 'draft' | 'pending-verification' | 'live' | 'rented' | 'inactive';
  verifiedAt?: Date;
  verificationNotes?: string;
  
  // Stats
  views: number;        // default: 0
  shortlists: number;   // default: 0
  
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { location: '2dsphere' }
// { 'address.city': 1, 'address.locality': 1, rent: 1 }
// { owner: 1, status: 1 }
// { status: 1, createdAt: -1 }
```

## Application Schema

```typescript
interface IApplication {
  _id: ObjectId;
  property: ObjectId;  // ref: Property
  tenant: ObjectId;    // ref: User
  owner: ObjectId;     // ref: User (denormalized for queries)
  
  status: 'applied' | 'shortlisted' | 'visit-scheduled' | 'visited' 
        | 'approved' | 'agreement-pending' | 'agreement-signed' 
        | 'rejected' | 'cancelled';
  
  message?: string;
  
  visitDetails?: {
    scheduledAt: Date;
    visitedAt?: Date;
    tenantNotes?: string;
    ownerNotes?: string;
  };
  
  threadId?: ObjectId;  // ref: MessageThread
  
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { tenant: 1, status: 1 }
// { property: 1, status: 1 }
// { owner: 1, createdAt: -1 }
```

## Lease Schema (with Escrow)

```typescript
interface ILease {
  _id: ObjectId;
  property: ObjectId;
  tenant: ObjectId;
  owner: ObjectId;
  application: ObjectId;
  
  // Agreement
  agreementUrl: string;       // PDF on Cloudinary
  agreementSignedByTenant: boolean;
  agreementSignedByOwner: boolean;
  signedAt?: Date;
  
  // Lease terms
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  depositAmount: number;
  
  // Escrow (CRITICAL state machine)
  escrow: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount: number;
    status: 'pending' | 'held' | 'disputed' | 'released-to-owner' 
          | 'refunded-to-tenant' | 'split';
    heldAt?: Date;
    releasedAt?: Date;
    splitDetails?: { toOwner: number; toTenant: number };
  };
  
  // Photo Lock
  moveInPhotos: Array<{
    roomName: string;       // 'kitchen' | 'bedroom-1' | 'bathroom' | 'hall'
    photoUrl: string;
    publicId: string;
    timestamp: Date;
    geoLocation: { lat: number; lng: number };
  }>;
  moveOutPhotos?: Array<{ /* same structure */ }>;
  
  // AI Damage Report
  aiDamageReport?: {
    damages: Array<{
      room: string;
      description: string;
      severity: 'minor' | 'moderate' | 'major';
      confidence: number;
    }>;
    suggestedDeduction: number;
    generatedAt: Date;
  };
  
  status: 'active' | 'completed' | 'terminated' | 'disputed';
  
  createdAt: Date;
  updatedAt: Date;
}
```

## Other Schemas (defined later)
- MessageThread, Message (chat)
- Review (ratings)
- Dispute (escrow disputes)
- Notification
- AuditLog