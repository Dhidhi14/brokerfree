import {
  PHOTO_LOCK_TRAP_AREA,
  type PhotoLockChangeSeverity,
  type PhotoLockOverallCondition,
} from '@/constants/photo-lock.constants';

const MOCK_PROCESSING_DELAY_MS = 1500;

export interface PhotoSetItem {
  area: string;
  url: string;
  publicId: string;
  uploadedAt: Date;
}

export interface PhotoComparisonFinding {
  area: string;
  changeDetected: boolean;
  severity: PhotoLockChangeSeverity;
  description: string;
}

export interface PhotoComparisonResult {
  findings: PhotoComparisonFinding[];
  overallCondition: PhotoLockOverallCondition;
  comparedAt: Date;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stable "mostly clean" roll keyed off area so demos don't flicker on retry.
 * ~1 in 8 areas get a minor finding; never significant in the mock.
 */
function mockMostlyClean(area: string): PhotoComparisonFinding {
  let hash = 0;
  for (const char of area) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const isMinor = hash % 8 === 0;

  if (isMinor) {
    return {
      area,
      changeDetected: true,
      severity: 'minor',
      description: 'Slight scuff or wear noted — consistent with normal occupancy',
    };
  }

  return {
    area,
    changeDetected: false,
    severity: 'none',
    description: 'No material change detected versus move-in photos',
  };
}

function computeOverallCondition(
  findings: PhotoComparisonFinding[]
): PhotoLockOverallCondition {
  if (findings.some((f) => f.severity === 'significant')) {
    return 'disputed';
  }
  if (findings.some((f) => f.severity === 'minor')) {
    return 'fair';
  }
  return 'good';
}

/**
 * MOCK vision comparison for move-in vs move-out photo sets.
 *
 * This is intentionally not calling any external AI API (no paid vision account
 * yet). A real implementation would:
 *   1. Fetch both image sets (Cloudinary URLs or buffers) and group by area.
 *   2. Send paired before/after images to a vision model (e.g. Claude Vision /
 *      GPT-4o) with a structured-JSON prompt asking for per-area
 *      { changeDetected, severity, description }.
 *   3. Parse the model output defensively (LLMs often return markdown fences or
 *      slightly malformed JSON) and fall back to severity "none" when a field
 *      is missing.
 *
 * Keep this function signature stable so the real provider can be swapped in
 * without changing photo-lock.service.ts call sites.
 */
export async function comparePhotoSets(
  moveInPhotos: PhotoSetItem[],
  moveOutPhotos: PhotoSetItem[]
): Promise<PhotoComparisonResult> {
  await delay(MOCK_PROCESSING_DELAY_MS);

  void moveInPhotos.map((p) => p.url);
  void moveOutPhotos.map((p) => p.url);

  const moveInAreas = new Set(moveInPhotos.map((p) => p.area));
  const moveOutAreas = new Set(moveOutPhotos.map((p) => p.area));
  const sharedAreas = [...moveInAreas].filter((area) => moveOutAreas.has(area)).sort();

  const findings: PhotoComparisonFinding[] = sharedAreas.map((area) => {
    if (area === PHOTO_LOCK_TRAP_AREA) {
      return {
        area,
        changeDetected: true,
        severity: 'minor',
        description:
          'Possible wear visible near the counter area — minor, consistent with normal use',
      };
    }

    return mockMostlyClean(area);
  });

  return {
    findings,
    overallCondition: computeOverallCondition(findings),
    comparedAt: new Date(),
  };
}
