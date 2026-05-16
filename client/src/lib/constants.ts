export interface CityCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export const INDIAN_CITIES: CityCoordinate[] = [
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Gurgaon', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', lat: 28.5355, lng: 77.391 },
  { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311 },
  { name: 'Thane', lat: 19.2183, lng: 72.9781 },
];

export const PROPERTY_TYPES = [
  '1BHK',
  '2BHK',
  '3BHK',
  '4BHK+',
  'Studio',
  'PG',
  'Villa',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FURNISHING_TYPES = [
  'fully-furnished',
  'semi-furnished',
  'unfurnished',
] as const;

export type FurnishingType = (typeof FURNISHING_TYPES)[number];

export interface AmenityCategory {
  label: string;
  items: { value: string; label: string }[];
}

export const AMENITIES: AmenityCategory[] = [
  {
    label: 'Building',
    items: [
      { value: 'lift', label: 'Lift' },
      { value: 'parking', label: 'Parking' },
      { value: 'gym', label: 'Gym' },
      { value: 'pool', label: 'Swimming Pool' },
    ],
  },
  {
    label: 'Utilities',
    items: [
      { value: '24x7-water', label: '24×7 Water' },
      { value: 'power-backup', label: 'Power Backup' },
      { value: 'gas-pipeline', label: 'Gas Pipeline' },
    ],
  },
  {
    label: 'Security',
    items: [
      { value: 'security', label: 'Security' },
      { value: 'cctv', label: 'CCTV' },
      { value: 'gated-community', label: 'Gated Community' },
    ],
  },
  {
    label: 'Lifestyle',
    items: [
      { value: 'wifi', label: 'WiFi Ready' },
      { value: 'ac', label: 'Air Conditioning' },
      { value: 'balcony', label: 'Balcony' },
      { value: 'pet-friendly', label: 'Pet Friendly' },
    ],
  },
];
