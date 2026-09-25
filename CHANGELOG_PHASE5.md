# Phase 5 Changelog

- Added `src/utils/rotationUtils.ts` for tracker-only per-vial site history helpers.
- Added optional `notes` to `InjectionLog`.
- Added Quick Log modal to `TodayScreen`.
- Quick Log supports vial selection, entered dose, tracker volume preview, site selection, and notes.
- Direct Inventory injection now uses per-vial tracker site history when available.
- History displays local recorded time and notes.
- CSV export includes a notes column.
- `clearHistory()` restores logged liquid volume to related inventory items.
- `getLiquidStatus()` honors `initialVolumeMl`.
- Persisted store version incremented from 3 to 4.
