const MOCK_PROCESSING_DELAY_MS = 2000;

/**
 * Amenities that the mock vision model always fails to detect.
 * Includes both human labels and repo amenity slugs so demos can flag
 * mismatches when a listing claims pool/garden (or free-text equivalents).
 */
const TRAP_AMENITIES = [
  'swimming pool',
  'private garden',
  'home theatre',
  'home theater',
  'pool',
  'garden',
] as const;

export interface AmenityDetectionResult {
  amenity: string;
  detected: boolean;
  confidence: number;
}

export interface VideoAnalysisResult {
  results: AmenityDetectionResult[];
  overallImpression: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAmenity(amenity: string): string {
  return amenity.trim().toLowerCase();
}

function isTrapAmenity(amenity: string): boolean {
  return (TRAP_AMENITIES as readonly string[]).includes(normalizeAmenity(amenity));
}

/**
 * Deterministic-ish high confidence in the 0.85–0.98 range, keyed off amenity
 * text so the same listing yields a stable demo score across polls/retries.
 */
function mockHighConfidence(amenity: string): number {
  let hash = 0;
  for (const char of amenity) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return Math.round((0.85 + (hash % 14) / 100) * 100) / 100;
}

/**
 * MOCK vision analysis for property tour frames.
 *
 * This is intentionally not calling any external AI API (no paid vision account
 * yet). A real implementation would:
 *   1. Download or pass the frame Cloudinary URLs / image bytes to a vision model
 *      (e.g. Claude Vision / GPT-4o) with a structured-JSON prompt listing the
 *      claimed amenities and asking for per-amenity { detected, confidence }.
 *   2. Parse the model output defensively (LLMs often return markdown fences or
 *      slightly malformed JSON) and fall back to "unknown / not detected" when
 *      a field is missing.
 *   3. Optionally include short evidence captions per amenity for admin review.
 *
 * Keep this function signature stable so the real provider can be swapped in
 * without changing video-verification.service.ts call sites.
 */
export async function analyzeVideoFrames(
  frameCloudinaryUrls: string[],
  claimedAmenities: string[]
): Promise<VideoAnalysisResult> {
  await delay(MOCK_PROCESSING_DELAY_MS);

  void frameCloudinaryUrls;

  const results: AmenityDetectionResult[] = claimedAmenities.map((amenity) => {
    if (isTrapAmenity(amenity)) {
      return {
        amenity,
        detected: false,
        confidence: 0.35,
      };
    }

    return {
      amenity,
      detected: true,
      confidence: mockHighConfidence(amenity),
    };
  });

  const undetected = results.filter((result) => !result.detected).map((result) => result.amenity);
  const overallImpression =
    undetected.length === 0
      ? 'The tour frames appear consistent with the amenities claimed on this listing.'
      : `The tour frames do not clearly show: ${undetected.join(', ')}.`;

  return { results, overallImpression };
}
