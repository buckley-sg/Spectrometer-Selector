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
  SearchResult,
} from "../types/spectrometer";

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
  codes: string[];
  allSlits: [number, number][]; // sorted ascending by slit width
}

export interface SelectorSearchResult {
  matches: EnrichedResult[];
  nearMisses: EnrichedResult[];
}

/**
 * Look up grating codes for a resolution record via the override table.
 * Iterates all platform × blaze combinations and collects unique codes.
 */
export function lookupGratingCodes(
  record: ResolutionRecord,
  overrides: GratingOverrides,
): string[] {
  const codes: string[] = [];
  for (const platform of record.platforms) {
    for (const blaze of record.blazeWavelengths) {
      const key = `${platform}|${record.gratingGrooves}|${blaze}`;
      const found = overrides[key];
      if (found) {
        codes.push(...found);
      }
    }
  }
  return [...new Set(codes)];
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

    // Look up grating codes
    const codes = lookupGratingCodes(r, overrides);

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
      codes,
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

  // Sort matches: largest slit first (best throughput), then best resolution
  matches.sort((a, b) => b.recSlit - a.recSlit || a.recRes - b.recRes);

  // Sort near misses: closest achievable resolution first
  nearMisses.sort((a, b) => a.recRes - b.recRes);

  return { matches, nearMisses };
}
