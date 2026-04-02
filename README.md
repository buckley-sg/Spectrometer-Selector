# Evolve Selector

A React + TypeScript tool for Evolve Sensing salespeople to quickly find the right spectrometer configuration for a customer's requirements.

Given a wavelength range and target resolution, it returns all compatible Evolve spectrometer platforms, grating configurations, and optimal slit widths — ranked by optical throughput. Each result includes full ordering part numbers and grating code wavelength windows.

## Quick Start

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Production Build

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build
```

## How It Works

1. Enter **min wavelength**, **max wavelength**, and **target resolution** (nm)
2. The selector searches 68 spectrometer configurations across 13 Evolve platforms
3. Results are ranked by throughput (largest viable slit width first), with in-range blaze wavelengths prioritised
4. Each result shows:
   - Recommended slit width and achievable resolution
   - Full ordering part numbers (`XXxxxx-SSS-GGGG` format)
   - Grating codes with their configured wavelength windows
   - All available slit options as a visual bar chart
5. If no exact matches exist, "near misses" show the closest alternatives
6. Check any results to compare them side-by-side in a table

## Part Number Format

Part numbers follow the pattern `XXxxxx-SSS-GGGG`:
- **XX** — OtO platform code (e.g. `SE`, `SW`)
- **xxxx** — model placeholder (customer specifies actual model)
- **SSS** — recommended slit width in µm, zero-padded to 3 digits
- **GGGG** — grating code (e.g. `DUV5`, `NIRC`)

## Project Structure

```
src/
├── App.tsx                     # Main application component
├── brand.ts                    # Evolve branding constants & product colors
├── main.tsx                    # React entry point
├── index.css                   # Minimal global styles
├── types/
│   └── spectrometer.ts         # TypeScript type definitions
├── data/
│   ├── index.ts                # Data loader (compact → full types)
│   ├── resolutionRecords.json  # 68 resolution records (compact format)
│   ├── gratingOverrides.json   # Grating code lookup table (~87 keys)
│   └── namingRecords.json      # Grating code → wavelength window (257 entries)
├── logic/
│   └── selector.ts             # Core search algorithm & helpers
└── components/
    ├── SearchForm.tsx           # Three-input search form
    ├── ResultCard.tsx           # Individual result display with part numbers
    ├── CompareTable.tsx         # Side-by-side comparison table
    └── SlitBar.tsx              # Visual slit width bar chart

data/                           # Source data & Python scripts
├── PROJECT_INSTRUCTIONS.md     # Full project documentation
├── parse_data_v2.py            # Excel → JSON data pipeline
├── selector.py                 # Python CLI selector (reference)
├── spectrometer_data.json      # Full parsed dataset
└── grating_overrides.json      # Manual override table
```

## Tech Stack

- **Vite** — build tool
- **React 19** — UI framework
- **TypeScript** — type safety
- **No external UI libraries** — inline styles, DM Sans via Google Fonts

## Evolve Sensing

Evolve Sensing (Redmond, WA) is the North American and European distributor for OtO Photonics spectrometer hardware.

Contact: steve@evolve-sensing.com | +1 425-969-8782

---

*Proprietary and Confidential*
