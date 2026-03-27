/**
 * Data loader — imports the raw JSON and normalises compact keys
 * into the full ResolutionRecord shape used by the rest of the app.
 */
import type {
  CompactResolutionRecord,
  ResolutionRecord,
  SlitResolutions,
  GratingOverrides,
  EvolveMap,
} from "../types/spectrometer";

import compactRecords from "./resolutionRecords.json";
import overrides from "./gratingOverrides.json";

/** Convert a compact record to the full typed shape. */
function expand(c: CompactResolutionRecord): ResolutionRecord {
  // Convert string-keyed slit map {"10": 0.2} → number-keyed {10: 0.2}
  const slitResolutions: SlitResolutions = {};
  for (const [k, v] of Object.entries(c.sl)) {
    slitResolutions[Number(k)] = v;
  }

  return {
    platforms: c.pl,
    evolveNames: c.en,
    isEvolve: c.ie,
    gratingGrooves: c.gg,
    blazeWavelengths: c.bw,
    bandwidthNm: c.bn,
    selectableRange: c.sr,
    slitResolutions,
    model: c.md,
    anomalyFixed: c.af,
  };
}

/** All 68 resolution records, fully typed. */
export const resolutionRecords: ResolutionRecord[] =
  (compactRecords as CompactResolutionRecord[]).map(expand);

/** Grating override lookup: "PLATFORM|grooves|blaze" → grating codes */
export const gratingOverrides: GratingOverrides = overrides as GratingOverrides;

/** OtO platform code → Evolve product name */
export const evolveMap: EvolveMap = {
  SE: "SmartEngine",
  EE: "EagleEye",
  HB: "HummingBird",
  SW: "SideWinder",
  SB: "SilverBullet",
  RB: "RedBullet",
  PD: "Phenom",
  MG: "Magna",
  DF: "Dragonfly",
  PH: "PocketHawk",
  DB: "Delta",
  GB: "GoldenBullet",
  MR: "Merak",
};
