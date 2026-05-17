export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return 'weak';
  }

  let score = 0;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

export const strengthLabels: Record<PasswordStrength, string> = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

export const strengthColors: Record<PasswordStrength, string> = {
  weak: 'bg-destructive',
  medium: 'bg-amber-500',
  strong: 'bg-emerald-500',
};
