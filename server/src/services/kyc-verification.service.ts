const MOCK_NETWORK_DELAY_MS = 1000;

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface VerificationResult {
  verified: boolean;
}

/**
 * MOCK DigiLocker Aadhaar verification.
 *
 * Replace this module's implementations with a real provider (e.g. DigiLocker
 * OAuth + document fetch) while keeping the same exported function signatures:
 *   verifyAadhaar(aadhaarNumber: string): Promise<VerificationResult>
 *   verifyPan(panNumber: string): Promise<VerificationResult>
 *
 * A real integration would call the government API, map success/failure to
 * { verified: boolean }, and handle timeouts/errors at this layer.
 */
export async function verifyAadhaar(aadhaarNumber: string): Promise<VerificationResult> {
  await delay(MOCK_NETWORK_DELAY_MS);

  const isValidFormat = /^\d{12}$/.test(aadhaarNumber);
  const isDemoRejection = aadhaarNumber.endsWith('0000');

  return { verified: isValidFormat && !isDemoRejection };
}

/**
 * MOCK PAN verification (format check only).
 *
 * A real NSDL/income-tax API would validate the PAN against the holder's name
 * and status; swap the body below for that HTTP call, same return shape.
 */
export async function verifyPan(panNumber: string): Promise<VerificationResult> {
  await delay(MOCK_NETWORK_DELAY_MS);

  return { verified: PAN_PATTERN.test(panNumber) };
}
