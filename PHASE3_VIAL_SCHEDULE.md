# BioStack PRO — Phase 3: Vial Lifecycle + Schedule Engine

Phase 3 integrates the schedule engine into the fridge inventory UI and gives each active inventory record a lightweight lifecycle state.

## Vial lifecycle

Inventory vials now support:
- `active`: available for logging a new injection;
- `empty`: remaining liquid reached zero;
- `archived`: intentionally hidden from the active inventory while preserving history.

Lifecycle metadata includes activation, empty, and archive timestamps where applicable. Archiving is reversible from the Inventory lifecycle filter.

An immutable `initialVolumeMl` snapshot is stored for each vial. This prevents later edits to the BAC Water metadata from changing the original-volume baseline used for progress and safe history restoration.

## Schedule engine

`src/utils/scheduleUtils.ts` now exposes deterministic schedule helpers for:
- daily occurrence status (`completed`, `due`, `missed`, `upcoming`, `inactive`);
- schedule start/end windows;
- paused schedules;
- next scheduled occurrence across a future window;
- today summary counts.

The engine only interprets tracking data already stored in the app. It does not choose, recommend, or alter a medical regimen.

## UI changes

Inventory now shows:
- active/empty/archived counts;
- today's completed/due/missed schedule summary;
- lifecycle filter chips;
- vial lifecycle badges;
- next/today schedule status per vial;
- a reversible archive action;
- a schedule pause/resume action;
- injection disabled for empty, archived, or paused vials.

## Data integrity changes

- injection logs use ISO timestamps for reliable local-date parsing;
- `recordInjection` moves a vial to `empty` automatically when its tracked liquid reaches zero;
- deleting a linked injection restores only the logged liquid amount and returns the vial lifecycle to `active`;
- persisted state is migrated to version 3.

## Verification

- Source syntax scan: PASS (0 diagnostics).
- `npm install` / full Expo typecheck could not be completed in the sandbox because dependency installation exceeded the execution time limit. Run `npm install` and `npm run typecheck` on Windows before installing the build.
