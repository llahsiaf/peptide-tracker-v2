# Experimental Changelog

## 2026-08-29 — Phase 1

- Fixed missing body-map injection-site export.
- Fixed legacy peptide database import mismatch.
- Fixed Rules-of-Hooks violations in two modal components.
- Added shared injection calculation utility.
- Centralized injection recording and liquid decrement in the Zustand store.
- Added freezer quantity validation.
- Added persisted-state normalization/migration version 1.
- Made new inventory IDs collision-resistant.
- Switched new reconstitution dates to ISO date strings.
- Added `typecheck` and `audit-syntax` scripts.

## Phase 2 — Data Foundation
- Consolidated domain types into `src/types/index.ts`.
- Kept store type re-exports for compatibility with current screens.
- Upgraded persisted state schema to version 2 with normalization.
- Made deletion of a logged injection restore linked inventory volume when safe.
- Replaced UTC-based reconstitution date generation with local-date formatting.
- Added pure schedule interpretation utilities in `src/utils/scheduleUtils.ts`.
- Added `scripts/verify-core.js` for dependency-free core assertions.

## Phase 3 — Vial Lifecycle + Schedule Engine

- Added `VialLifecycleStatus` and lifecycle metadata to inventory records.
- Added immutable `initialVolumeMl` for reliable vial-volume baselines.
- Added reversible inventory archive/restore actions and lifecycle filtering.
- Added schedule pause/resume state and schedule window fields.
- Expanded schedule utilities with occurrence statuses, next-occurrence lookup, and daily summary counts.
- Integrated schedule status and lifecycle status into Inventory UI.
- Standardized newly recorded injection timestamps to ISO format while preserving a local display timestamp.
- Automatically marks a vial empty when tracked volume reaches zero.
- Bumped persisted store migration version to 3.
- Static syntax verification: PASS (0 diagnostics).
- Full dependency install/typecheck remains to be run on a developer machine because sandbox `npm install` exceeded its execution timeout.


## Phase 6 — Personal Timeline + Analytics 2.0
- Added per-vial journey analytics and usage summaries.
- Added descriptive peptide usage statistics.
- Added History usage dashboard and vial journey cards.
- Removed duplicate `activeVials` declaration in TodayScreen.
- Added Phase 6 verification script.

## Phase 7 — Settings, Backup/Restore + Privacy

- Added Settings screen accessible from the main header.
- Added validated JSON backup export/import with explicit restore confirmation.
- Added `replaceData()` restore action with state normalization.
- Excluded AI API keys from tracker backups.
- Added explicit AI online privacy consent, default OFF.
- Updated FloatingAIChat to respect the privacy switch before remote API requests.
- Added `expo-document-picker` for selecting restore files.
- Added local data reset control.
- Bumped persisted store schema to version 5.
- Added Phase 7 verification script.

## Phase 8 — UX Overhaul
- Added shared UI design tokens in `src/theme.ts`.
- Replaced top tab navigation with bottom navigation.
- Added `LOCAL` privacy indicator and simplified app subtitle.
- Adjusted AI floating button position to avoid navigation overlap.
- Increased bottom safe space on scrolling screens.
- Refined AI welcome copy to emphasize tracker/data use and privacy.
- Added `verify-phase8` source-level verification.


## Phase 9 — Personal Analytics 2.0
- Added dedicated Analytics screen.
- Added 14/30/60-day range filtering and peptide filtering.
- Added daily activity visualization and peptide usage ranking.
- Added vial timeline view.
- Added historical schedule range helper for correct past-date completion calculations.
- Added analytics disclaimer and local-only design.

## Phase 10
- Added `notificationUtils.ts` for local notification permission, diagnostics, cancellation, test notification, and 30-day schedule rebuild.
- Added notification status/test/rebuild controls to Settings.
- Persisted notification IDs per inventory item.
- Rebuilt local reminders at app startup when notification permission is granted.
- Tapping a notification returns the user to Today.



## Phase 10.1 — GitHub Actions IPA Pipeline
- Reworked `.github/workflows/build-ipa.yml` for deterministic unsigned iOS builds.
- Uses Node 20 + `npm ci` and runs Phase 10 verification before native generation.
- Generates the iOS project with non-interactive Expo prebuild.
- Explicitly discovers the generated workspace and Xcode scheme.
- Builds Release for generic iOS with code signing disabled.
- Packages the generated `.app` into `BioStack_PRO_iOS_unsigned.ipa`.
- Uploads the IPA together with the Xcode build log as a GitHub Actions artifact.
- Removed the previous assumption that APNs entitlements are required for local notification testing.
