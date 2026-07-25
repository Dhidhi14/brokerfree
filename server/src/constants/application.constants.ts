export const APPLICATION_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export const ACTIVE_APPLICATION_STATUSES = ['pending', 'accepted'] as const;

export const APPLICATION_MESSAGE_MIN_LENGTH = 10;

export const APPLICATION_MESSAGE_MAX_LENGTH = 500;
