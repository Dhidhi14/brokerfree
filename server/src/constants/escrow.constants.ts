export const ESCROW_STATUSES = [
  'pending',
  'held',
  'released',
  'refunded',
  'disputed',
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];
