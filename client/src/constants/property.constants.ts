export const PROPERTY_STATUSES = [
  'draft',
  'pending-verification',
  'live',
  'rented',
  'inactive',
] as const;

export const PROPERTY_MAX_PHOTOS = 10;

export const PROPERTY_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const PROPERTY_ACCEPT_STRING = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export const AMENITY_GROUPS = {
  basic: [
    { value: '24x7-water', label: '24×7 Water' },
    { value: 'power-backup', label: 'Power Backup' },
    { value: 'parking', label: 'Parking' },
    { value: 'lift', label: 'Lift' },
    { value: 'wifi', label: 'WiFi' },
  ],
  comfort: [
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'geyser', label: 'Geyser' },
    { value: 'modular-kitchen', label: 'Modular Kitchen' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'furnished-bedroom', label: 'Furnished Bedroom' },
  ],
  building: [
    { value: 'gym', label: 'Gym' },
    { value: 'pool', label: 'Swimming Pool' },
    { value: 'garden', label: 'Garden' },
    { value: 'clubhouse', label: 'Clubhouse' },
    { value: 'play-area', label: 'Play Area' },
  ],
  security: [
    { value: 'security', label: 'Security' },
    { value: 'cctv', label: 'CCTV' },
    { value: 'intercom', label: 'Intercom' },
    { value: 'gated-community', label: 'Gated Community' },
    { value: 'fire-safety', label: 'Fire Safety' },
  ],
} as const;

export const ALL_AMENITY_VALUES = [
  ...AMENITY_GROUPS.basic,
  ...AMENITY_GROUPS.comfort,
  ...AMENITY_GROUPS.building,
  ...AMENITY_GROUPS.security,
].map((item) => item.value);

export const PROPERTY_STATUS_LABELS: Record<
  (typeof PROPERTY_STATUSES)[number],
  string
> = {
  draft: 'Draft',
  'pending-verification': 'Pending Review',
  live: 'Live',
  rented: 'Rented',
  inactive: 'Rejected',
};
