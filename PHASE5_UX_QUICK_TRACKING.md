# BioStack PRO — Phase 5: UX & Quick Tracking

Phase 5 focuses on reducing friction when recording a real-world event while keeping the app a tracker rather than a treatment decision engine.

## Changes

### Quick Log
Today now opens an in-place `Catat Injeksi` modal:
- selects from active vials
- shows recorded remaining liquid
- lets the user enter the dose value to record
- calculates the corresponding tracker volume from stored vial parameters
- lets the user choose the injection-site code
- supports an optional personal note
- records date/time in local display fields as well as ISO timestamp
- uses the existing atomic `recordInjection()` store operation

### Per-vial tracker site suggestion
`rotationUtils.ts` derives a suggested site from the historical site usage for the selected vial. This is only a bookkeeping convenience and is not medical guidance.

### History
History now shows optional notes and prefers the local display timestamp. CSV export includes the note column.

### History consistency
`clearHistory()` now restores the volume represented by the deleted logs back into the related inventory items, capped at the original tracked volume. This matches the existing single-log delete behavior.

### Calculation consistency
`getLiquidStatus()` now respects `initialVolumeMl` when it exists, rather than reconstructing the baseline from BAC water.

## Verification

`npm run audit-syntax` equivalent:
- TypeScript/TSX syntax diagnostics: 0

A full Expo/TypeScript typecheck still requires dependencies to be installed in the local project (`npm install`).
