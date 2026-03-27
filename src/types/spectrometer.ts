/**
 * Type definitions for the Spectrometer Selector.
 *
 * Two shapes exist for resolution records:
 *   - CompactResolutionRecord  – minified keys used in the embedded JSX data
 *   - ResolutionRecord         – human-readable keys used everywhere else
 *
 * The data layer normalises compact → full at import time so the rest of
 * the app only deals with ResolutionRecord.
 */

// ── Compact (minified) shape from the original JSX ──────────────────────

export interface CompactResolutionRecord {
  pl: string[];           // platform codes, e.g. ["SE","EE"]
  en: string[];           // evolve names,   e.g. ["SmartEngine","EagleEye"]
  ie: boolean;            // is_evolve
  gg: number;             // grating groove density (g/mm)
  bw: number[];           // blaze wavelengths (nm)
  bn: number;             // bandwidth (nm)
  sr: [number, number];   // selectable range [min, max] (nm)
  sl: Record<string, number>; // slit (µm string) → resolution (nm)
  md?: string;            // model name (optional)
  af?: boolean;           // anomaly_fixed flag (optional)
}

// ── Full (readable) shape used throughout the app ───────────────────────

export interface SlitResolutions {
  [slitMicrons: number]: number;   // slit width (µm) → optical resolution (nm)
}

export interface ResolutionRecord {
  platforms: string[];
  evolveNames: string[];
  isEvolve: boolean;
  gratingGrooves: number;
  blazeWavelengths: number[];
  bandwidthNm: number;
  selectableRange: [number, number];
  slitResolutions: SlitResolutions;
  model?: string;
  anomalyFixed?: boolean;
}

// ── Grating override table ──────────────────────────────────────────────

/** Key format: "PLATFORM|grooves|blaze" → array of grating code strings */
export type GratingOverrides = Record<string, string[]>;

// ── Search inputs & results ─────────────────────────────────────────────

export interface SearchParams {
  wlMin: number;
  wlMax: number;
  maxResolution: number;
}

export interface MatchResult {
  record: ResolutionRecord;
  recommendedSlitUm: number;
  resolutionAtSlit: number;
  gratingCodes: string[];
}

export interface SearchResult {
  matches: MatchResult[];
  nearMisses: NearMissResult[];
}

export interface NearMissResult {
  record: ResolutionRecord;
  bestSlitUm: number;
  bestResolution: number;
  gratingCodes: string[];
}

// ── Evolve product name map ─────────────────────────────────────────────

export type EvolveMap = Record<string, string>;
