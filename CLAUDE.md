# Project: Evolve Selector

## Overview
A React + TypeScript tool for Evolve Sensing salespeople to quickly find the right spectrometer configuration. Given a wavelength range and target resolution, it returns compatible platforms, gratings, and optimal slit widths ranked by throughput. Each result includes full ordering part numbers and grating code wavelength windows.

- **GitHub**: buckley-sg/Spectrometer-Selector (private)
- **Branch**: master
- **Related**: The main Lumos spectrometer application lives at `../Coding/`

## Architecture
- **Vite** build tool with React 19 + TypeScript
- Self-contained: all spectrometer data embedded as JSON (no server/API needed)
- Inline styles with Evolve Sensing branding (no external UI libraries)
- Core selector logic in `src/logic/selector.ts` (pure functions, no React dependency)

## Part Number Format

Part numbers follow the pattern `XXxxxx-SSS-GGGG`:
- **XX** — OtO platform code (e.g. `SE` = SmartEngine, `SW` = SideWinder)
- **xxxx** — model placeholder (the customer specifies the actual model number)
- **SSS** — recommended slit width in micrometres, zero-padded to 3 digits
- **GGGG** — grating code (e.g. `DUV5`, `V14`, `NIRC`)

Example: `SExxxx-100-V14` means SmartEngine platform, 100 µm slit, grating code V14.

The placeholder `xxxx` was chosen over `NNNN` — Steve prefers lowercase to signal it's a placeholder the customer fills in.

## Data Sources

Three JSON files power the selector, all in `src/data/`:

| File | Entries | Description | Source |
|------|---------|-------------|--------|
| `resolutionRecords.json` | 68 | Optical bench x grating configs with slit-resolution tables | Parsed from Excel via `data/parse_data_v2.py` |
| `gratingOverrides.json` | ~87 keys | Maps `"PLATFORM\|grooves\|blaze"` to grating code arrays | Manual override table (`data/grating_overrides.json`) |
| `namingRecords.json` | 257 | Maps grating code string to `[wlMin, wlMax]` wavelength window | Extracted from `data/spectrometer_data.json` |

### Why the override table exists
The same grating (grooves/mm + blaze) can map to different codes depending on the platform. The override table resolves this ambiguity with a composite key of platform, groove density, and blaze wavelength.

### Regenerating data
1. Get new OtO Excel files
2. Run `data/parse_data_v2.py` to regenerate `data/spectrometer_data.json`
3. Extract compact arrays into `src/data/resolutionRecords.json` and `src/data/gratingOverrides.json`
4. Extract naming records into `src/data/namingRecords.json`
5. Rebuild

## Key Files
- `src/types/spectrometer.ts` — All TypeScript type definitions
- `src/data/` — JSON data files + loader that normalises compact → full types
- `src/logic/selector.ts` — Search algorithm and shared helpers
- `src/components/` — React components: SearchForm, ResultCard, CompareTable, SlitBar
- `src/brand.ts` — Evolve branding constants (navy, green, teal, 13 product colours)
- `data/` — Python source scripts and full dataset for data regeneration

## Search Algorithm (`src/logic/selector.ts`)
1. Filter records whose selectable range fully covers the requested wavelength window
2. Filter records whose bandwidth accommodates the requested range
3. For each surviving record, find the **largest slit** that meets the resolution spec (maximises throughput)
4. If no slit meets the spec, classify as a "near miss" using the narrowest slit
5. Sort results: slit width (throughput) > in-range blaze count > resolution

### Shared helpers
- `blazeSortComparator()` — single sort function used by ResultCard and CompareTable to order blazes (in-range first, then ascending)
- `blazeInRange()` — checks if a blaze wavelength falls inside the search window
- `formatPartNumber()` — assembles the `XXxxxx-SSS-GGGG` string

## Domain Knowledge
- See `data/PROJECT_INSTRUCTIONS.md` for full business context and data pipeline documentation
- Key physics: bandwidth x resolution trade-off. Higher groove density = narrower bandwidth but better resolution
- Selector always recommends the LARGEST slit meeting the spec (maximum throughput)

## Workflows

### Development
```bash
npm install
npm run dev          # Vite dev server at http://localhost:5173
```

### Preview via Claude Code
The `.claude/launch.json` is configured to start the dev server on port 3003 using `node` directly (not `npx`, which has spawn issues on Windows).

### Type checking
```bash
npx tsc --noEmit
```

### Building the Desktop App (Electron)

The app can be packaged as a standalone Windows desktop application called "Evolve Selector" using Electron + electron-builder.

```bash
npm run build:electron
```

This runs the full pipeline: TypeScript check → Vite production build → Electron TypeScript compile → electron-builder packaging.

**Output** in `release/`:
- `Evolve Selector Setup 1.0.0.exe` — NSIS installer (~83 MB), installs to user's AppData
- `EvolveSelector-1.0.0-portable.exe` — portable exe (~83 MB), runs without installation

**Distribution**: Share via OneDrive link (email providers block `.exe` attachments). The portable exe is the easiest option — no installation required.

**Note**: The exe is unsigned, so Windows SmartScreen will show a warning on first launch. The recipient clicks "More info" → "Run anyway". A code-signing certificate (~$200-400/year) would eliminate this.

**Bumping the version**: Update `"version"` in `package.json` before building. The version appears in the installer filename and the app's About info.

### GitHub Pages (Web Deployment)

The app is deployed as a static site via GitHub Pages:

**Live URL**: https://buckley-sg.github.io/Spectrometer-Selector/

- Deploys automatically on every push to `master` via `.github/workflows/deploy.yml`
- GitHub Pages source must be set to **"GitHub Actions"** in repo Settings → Pages (not "Deploy from a branch")
- `vite.config.ts` uses `GITHUB_PAGES` env var to set `base: "/Spectrometer-Selector/"` for Pages builds, while keeping `base: "./"` for Electron/local builds
- Repo is **public** (required for free GitHub Pages)
- Works on any device with a browser — phones, tablets, Raspberry Pi, etc.
- Preferred distribution method: just share the URL (no exe, no installer, no SmartScreen warnings)

### Electron Architecture
- `electron-src/main.ts` → compiled to `electron/main.cjs` (CommonJS required because `package.json` has `"type": "module"`)
- `electron-src/preload.ts` → compiled to `electron/preload.cjs`
- No menu bar, branded window with Evolve icon
- In dev: `npm run dev:electron` builds and launches Electron locally
- `electron/` output is gitignored; `release/` output is gitignored

## Instructions for Claude
At the end of every task or work session, ask Steve: **"Is there anything from this session you'd like me to add to CLAUDE.md so I remember it next time?"**

---
*Last updated: 2026-04-01*
