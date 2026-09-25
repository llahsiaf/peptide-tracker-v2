# BioStack PRO — Phase 2 Foundation

Phase 2 focuses on unifying the domain model and making state transitions safer before adding larger UI features.

## Changes

### 1. Canonical domain types
`src/types/index.ts` is now the single source for `InventoryItem`, `FreezerItem`, `InjectionLog`, units, dose presets, and frequency keys.

`src/store/useBioStackStore.ts` imports and re-exports those types for backward compatibility with existing screens.

### 2. State migration / normalization
Persisted state is now version 2. Inventory and injection history are normalized when loaded so malformed or legacy values do not immediately reach the UI.

### 3. Injection deletion consistency
Deleting a logged injection now restores its recorded liquid volume to the linked inventory item when possible. Restoration is capped at the vial's original liquid volume.

### 4. Local-date handling
Reconstitution dates are generated using local calendar dates rather than UTC string slicing, preventing late-night timezone rollovers from producing the wrong date.

### 5. Schedule engine (pure utilities)
`src/utils/scheduleUtils.ts` provides deterministic helpers for:
- mapping dates to Indonesian weekday labels;
- determining whether a stored schedule is active on a date;
- checking whether an occurrence already has a log;
- finding the next stored schedule occurrence and flagging a missed occurrence for the current day.

The schedule engine only interprets user-entered tracking data; it does not select or recommend a medical regimen.

## Verification

- Source syntax scan: PASS (0 diagnostics)
- Core utility verification: PASS
- Full Expo/React Native typecheck remains dependent on installing project dependencies (`npm install`) because the uploaded backup intentionally does not include `node_modules`.
