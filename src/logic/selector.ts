/**
 * Core spectrometer selector logic.
 *
 * Given a wavelength range and maximum resolution, finds all Evolve
 * spectrometer configurations that fully cover the range, recommending
 * the largest slit width that still meets the resolution spec
 * (maximising optical throughput).
 *
 * If no exact matches exist, returns "near misses" — configs that cover
 * the wavelength range but cannot achieve the resolution even at the
 * narrowest slit.
 */
import type {
  ResolutionRecord,
  GratingOverrides,
  CodeInfo,
  CodeRangeLookup,
} from "../types/spectrometer";

/** Grating codes grouped by blaze wavelength (nm). */
export type BlazeCodeMap = Record<number, CodeInfo[]>;

/** Enriched result record carried through Card / Compare. */
export interface EnrichedResult {
  /** Original resolution record fields */
  platforms: string[];
  evolveNames: string[];
  isEvolve: boolean;
  gratingGrooves: number;
  blazeWavelengths: number[];
  bandwidthNm: number;
  selectableRange: [number, number];
  model?: string;

  /** Computed fields */
  recSlit: number;
  recRes: number;
  codesByBlaze: BlazeCodeMap;
  allSlits: [number, number][]; // sorted ascending by slit width
}

export interface SelectorSearchResult {
  matches: EnrichedResult[];
  nearMisses: EnrichedResult[];
}

/**
 * Look up grating codes grouped by blaze wavelength, enriched with
 * each code's configured wavelength window from the naming table.
 * Includes ALL blaze wavelengths so the UI can annotate out-of-range ones.
 */
export function lookupGratingCodesByBlaze(
  record: ResolutionRecord,
  overrides: GratingOverrides,
  codeRangeLookup: CodeRangeLookup,
): BlazeCodeMap {
  const result: BlazeCodeMap = {};
  for (const blaze of record.blazeWavelengths) {
    const codeStrs: string[] = [];
    for (const platform of record.platforms) {
      const key = `${platform}|${record.gratingGrooves}|${blaze}`;
      const found = overrides[key];
      if (found) codeStrs.push(...found);
    }
    const unique = [...new Set(codeStrs)];
    if (unique.length > 0) {
      result[blaze] = unique.map((code) => {
        const range = codeRangeLookup[code];
        return {
          code,
          wlMin: range ? range[0] : null,
          wlMax: range ? range[1] : null,
        };
      });
    }
  }
  return result;
}

/**
 * Format a part number: XXNNNN-SSS-GGGG
 * XX = platform code, NNNN = literal placeholder, SSS = slit zero-padded, GGGG = grating code
 */
export function formatPartNumber(platform: string, slitUm: number, gratingCode: string): string {
  const sss = String(slitUm).padStart(3, "0");
  return `${platform}xxxx-${sss}-${gratingCode}`;
}

/** Returns true if a blaze wavelength is inside the user's search window. */
export function blazeInRange(blaze: number, wlMin: number, wlMax: number): boolean {
  return blaze >= wlMin && blaze <= wlMax;
}

/** Count how many blaze wavelengths in this result fall within the search range. */
function countInRangeBlazes(r: { codesByBlaze: BlazeCodeMap }, wlMin: number, wlMax: number): number {
  return Object.keys(r.codesByBlaze)
    .map(Number)
    .filter(b => blazeInRange(b, wlMin, wlMax)).length;
}

/**
 * Generate a stable unique ID for a record (used for checkbox state).
 */
export function recordId(r: EnrichedResult): string {
  return `${r.platforms.join("")}-${r.gratingGrooves}-${r.blazeWavelengths.join("")}-${r.model ?? ""}`;
}

/**
 * Main search function.
 *
 * @param wlMin       - minimum wavelength required (nm)
 * @param wlMax       - maximum wavelength required (nm)
 * @param maxRes      - maximum acceptable resolution (nm, smaller = better)
 * @param records     - resolution records to search
 * @param overrides   - grating code override table
 */
export function search(
  wlMin: number,
  wlMax: number,
  maxRes: number,
  records: ResolutionRecord[],
  overrides: GratingOverrides,
  codeRangeLookup: CodeRangeLookup = {},
): SelectorSearchResult {
  const requiredBandwidth = wlMax - wlMin;
  const matches: EnrichedResult[] = [];
  const nearMisses: EnrichedResult[] = [];

  for (const r of records) {
    // Filter: must have selectable range and bandwidth
    if (!r.selectableRange || r.bandwidthNm === null) continue;

    // Filter: bandwidth must accommodate the requested range
    if (r.bandwidthNm < requiredBandwidth) continue;

    // Filter: selectable range must fully cover both endpoints
    if (r.selectableRange[0] > wlMin || r.selectableRange[1] < wlMax) continue;

    // Build sorted slit array: [[slitUm, resolutionNm], ...]
    const slitEntries: [number, number][] = Object.entries(r.slitResolutions)
      .map(([k, v]) => [Number(k), v] as [number, number])
      .sort((a, b) => a[0] - b[0]); // ascending by slit width

    if (slitEntries.length === 0) continue;

    // Look up grating codes grouped by blaze wavelength (all blazes)
    const codesByBlaze = lookupGratingCodesByBlaze(r, overrides, codeRangeLookup);

    // Build the enriched base record
    const base = {
      platforms: r.platforms,
      evolveNames: r.evolveNames,
      isEvolve: r.isEvolve,
      gratingGrooves: r.gratingGrooves,
      blazeWavelengths: r.blazeWavelengths,
      bandwidthNm: r.bandwidthNm,
      selectableRange: r.selectableRange,
      model: r.model,
      codesByBlaze,
      allSlits: slitEntries,
    };

    // Find the largest slit that achieves the required resolution
    // (search from largest to smallest)
    let bestSlit: [number, number] | null = null;
    const descSlits = [...slitEntries].sort((a, b) => b[0] - a[0]);
    for (const [slitUm, res] of descSlits) {
      if (res <= maxRes) {
        bestSlit = [slitUm, res];
        break;
      }
    }

    if (bestSlit) {
      matches.push({ ...base, recSlit: bestSlit[0], recRes: bestSlit[1] });
    } else {
      // Near miss: use the narrowest slit (best resolution achievable)
      const narrowest = slitEntries[0]; // smallest slit = best resolution
      nearMisses.push({ ...base, recSlit: narrowest[0], recRes: narrowest[1] });
    }
  }

  // Sort matches: in-range blaze first, then largest slit (best throughput), then best resolution
  matches.sort((a, b) => {
    const aIn = countInRangeBlazes(a, wlMin, wlMax);
    const bIn = countInRangeBlazes(b, wlMin, wlMax);
    // Configs with any in-range blaze come first
    if ((aIn > 0) !== (bIn > 0)) return bIn > 0 ? 1 : -1;
    // Among those, more in-range blazes is better
    if (aIn !== bIn) return bIn - aIn;
    // Then by throughput and resolution
    return b.recSlit - a.recSlit || a.recRes - b.recRes;
  });

  // Sort near misses: in-range blaze first, then closest achievable resolution
  nearMisses.sort((a, b) => {
    const aIn = countInRangeBlazes(a, wlMin, wlMax);
    const bIn = countInRangeBlazes(b, wlMin, wlMax);
    if ((aIn > 0) !== (bIn > 0)) return bIn > 0 ? 1 : -1;
    return a.recRes - b.recRes;
  });

  return { matches, nearMisses };
}
