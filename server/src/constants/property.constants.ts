export const PROPERTY_CLOUDINARY_FOLDER = 'brokerfree/properties';

export const PROPERTY_MAX_PHOTOS = 10;

export const PROPERTY_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const PROPERTY_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const PROPERTY_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const PROPERTY_TYPES = [
  '1BHK',
  '2BHK',
  '3BHK',
  '4BHK+',
  'Studio',
  'PG',
  'Villa',
] as const;

export const FURNISHING_TYPES = [
  'fully-furnished',
  'semi-furnished',
  'unfurnished',
] as const;

export const PROPERTY_STATUSES = [
  'draft',
  'pending-verification',
  'live',
  'rented',
  'inactive',
] as const;

export const AMENITIES = {
  basic: ['24x7-water', 'power-backup', 'parking', 'lift', 'wifi'],
  comfort: ['ac', 'geyser', 'modular-kitchen', 'balcony', 'furnished-bedroom'],
  building: ['gym', 'pool', 'garden', 'clubhouse', 'play-area'],
  security: ['security', 'cctv', 'intercom', 'gated-community', 'fire-safety'],
} as const;

export const ALL_AMENITIES = [
  ...AMENITIES.basic,
  ...AMENITIES.comfort,
  ...AMENITIES.building,
  ...AMENITIES.security,
] as const;

export interface IndianCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const INDIAN_CITIES: IndianCity[] = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  { name: 'Gurgaon', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
];
