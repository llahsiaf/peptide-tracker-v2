# BioStack PRO — Phase 1 Audit & Experiment

This folder is the experimental backup copy. The original repository is not modified by these changes.

## What was audited

- Entry point and navigation
- Zustand/AsyncStorage state model
- Inventory calculations and injection logging flow
- Freezer → fridge transitions
- Rotation/body-map data
- Legacy/unused components and their TypeScript imports
- Calendar export utility

## Confirmed issues addressed

1. **Missing `INJECTION_SITES` export**
   `BodyMapRotation.tsx` imported a symbol that was not exported by the peptide database. A shared four-point site definition is now exported from `defaultPeptides.ts`.

2. **Missing `MASTER_PEPTIDE_DATABASE` export / field mismatch**
   `ReconstituteWizard.tsx` referenced an export that did not exist and expected legacy field names. The component now reads `DEFAULT_PEPTIDES` and maps its current fields explicitly. A compatibility alias is also exported for older callers.

3. **Conditional React hooks**
   `ReconstituteWizard` and `DoseDetailModal` returned before calling hooks when no item was supplied. This violates the Rules of Hooks and can cause render-order errors. Hooks now run unconditionally.

4. **Stale modal state**
   `ReconstituteWizard` now resets its local state when the selected freezer item changes, preventing values from a previous vial from carrying over.

5. **Non-atomic injection recording**
   Inventory previously appended a history record and then separately updated liquid remaining. A new `recordInjection` store action validates the inventory, checks available liquid, logs the injection, rotates the next site, and decrements remaining volume in one state transaction.

6. **Dose unit ignored during calculation**
   The inventory calculator previously used vial unit implicitly. The new calculation utility handles `mg ↔ mcg` conversion and explicitly treats `mL` products as volume-based.

7. **Negative freezer quantities**
   Freezer quantity writes are now clamped to non-negative integers. The migration path also normalizes persisted freezer quantities.

8. **Inventory IDs could collide under rapid operations**
   Newly created inventory IDs now include a random suffix in addition to the timestamp.

9. **Reconstitution date was localized text**
   Newly created inventory records now store the reconstitution date as `YYYY-MM-DD`, which is stable for future date arithmetic. Existing records are intentionally not rewritten in this phase.

10. **Hard-coded 80% shelf-life estimate on new vials**
    New reconstituted records now start with the configured maximum fridge window instead of an arbitrary 80% value. This is a tracker state, not a claim about real-world stability.

## Deliberate non-changes

- No automatic medical dosing recommendations were added.
- Existing peptide templates were not rewritten in this phase.
- The original GitHub repository remains untouched.
- Full TypeScript compilation cannot be confirmed in this sandbox because `node_modules` is not included in the uploaded ZIP.

## Verification

A TypeScript transpile/syntax scan was run against all `.ts`/`.tsx` files and returned **0 syntax diagnostics**. Full `tsc --noEmit` is blocked by missing project dependencies in the uploaded archive.

## Next phase candidates

- Unify the duplicate data models in `src/types` and `src/store`.
- Add explicit vial IDs to every injection record and connect history to inventory.
- Build a schedule/event model separate from completed injection history.
- Add backup/restore export with schema versioning.
- Add Today/Calendar/Analytics views.
- Add per-peptide or per-vial rotation profiles instead of one global rotation pointer.
