# Project: Spectrometer Selector

## Overview
A React + TypeScript tool for Evolve Sensing salespeople to quickly find the right spectrometer configuration. Given wavelength range and resolution requirements, it returns compatible platforms, gratings, and optimal slit widths ranked by throughput.

## Architecture
- **Vite** build tool with React 18 + TypeScript
- Self-contained: all spectrometer data embedded as JSON (no server/API needed)
- Inline styles with Evolve Sensing branding
- Core selector logic in `src/logic/selector.ts` (pure functions, no React dependency)

## Key Files
- `src/types/spectrometer.ts` — All TypeScript type definitions
- `src/data/` — JSON data files + loader that normalises compact → full types
- `src/logic/selector.ts` — Search algorithm: filters by wavelength coverage, finds largest slit meeting resolution spec
- `src/components/` — React components: SearchForm, ResultCard, CompareTable, SlitBar
- `src/brand.ts` — Evolve branding constants
- `data/` — Python source scripts and full dataset for data regeneration

## Workflows

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Updating spectrometer data
1. Get new OtO Excel files
2. Run `data/parse_data_v2.py` to regenerate `data/spectrometer_data.json`
3. Extract compact RES/OVR arrays into `src/data/resolutionRecords.json` and `src/data/gratingOverrides.json`
4. Rebuild

## Data Model
- **Resolution records** (68): Each represents an optical bench × grating combination with slit-to-resolution curves
- **Grating overrides** (70): Manual lookup table keyed by "PLATFORM|grooves|blaze" → grating code strings
- Compact format uses short keys (pl, en, ie, gg, bw, bn, sr, sl) to minimise bundle size

## Domain Knowledge
- See `data/PROJECT_INSTRUCTIONS.md` for full business context, domain knowledge, and data pipeline documentation
- Key physics: bandwidth × resolution trade-off. Higher groove density = narrower bandwidth but better resolution
- Selector always recommends the LARGEST slit meeting the spec (maximum throughput)

## Version Control
- **GitHub**: buckley-sg/Spectrometer-Selector (private)
- **Branch**: master

## Instructions for Claude
At the end of every task or work session, ask Steve: **"Is there anything from this session you'd like me to add to CLAUDE.md so I remember it next time?"**

---
*Last updated: 2026-03-27*
