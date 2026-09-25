# BioStack PRO — Phase 6

Phase 6 focuses on **Personal Timeline + Vial Journey + Analytics 2.0**.

## Goals

- Connect each vial to its historical injection activity.
- Make vial usage visible without modifying dose/schedule decisions.
- Add concise usage statistics to History.
- Remove a compile-time duplicate declaration discovered in TodayScreen.

## Changes

### `src/utils/analyticsUtils.ts`

New pure helpers:

- `getVialJourneys()` — builds a per-vial usage view from inventory + history.
- `getDailyActivity()` — prepares daily activity points for future charting.
- `getPeptideUsageStats()` — aggregates injection count, logged volume, and note count per peptide.

The analytics are descriptive only: they summarize user-entered tracker data and do not produce treatment recommendations.

### `HistoryScreen`

Added:

- Ringkasan Penggunaan
- total logs
- total logged volume
- number of tracked vials
- most frequently logged peptide
- Perjalanan Vial section
- per-vial progress based on `initialVolumeMl` vs current volume
- injection count
- notes count
- next scheduled occurrence

### `TodayScreen`

Fixed duplicate `activeVials` declaration introduced during earlier phase work. The stricter active-vial filter is now the single source.

## Validation

- `node scripts/audit-syntax.js` → **0 diagnostics**
- `node scripts/verify-phase6.js` → **PASS**
- Full Expo/TypeScript build still needs to be validated in the Windows development environment after `npm install`.

## Checkpoint

This ZIP is an experimental checkpoint derived from Phase 5. The original GitHub repo remains untouched.
