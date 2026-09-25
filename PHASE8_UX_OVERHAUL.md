# Phase 8 — UX Overhaul

## Goals
- Make Today the clear home screen.
- Replace the dense horizontal tab row with a thumb-friendly bottom navigation bar.
- Keep Settings reachable without using a primary tab.
- Establish a shared visual token file for future UI work.
- Reserve safe space above the bottom nav for the floating AI control.
- Keep the AI assistant positioned as a tracker assistant rather than a therapy decision engine.

## Changes
- Added `src/theme.ts` for shared colors, radii, spacing, and shadows.
- Redesigned `App.tsx` header and bottom navigation.
- Added a small `LOCAL` privacy/status indicator in the header.
- Changed the header subtitle to `Personal Tracker`.
- Raised the floating AI control to avoid the bottom navigation bar.
- Increased bottom content padding on scroll-heavy screens.
- Updated the AI welcome copy to be data-first and privacy-first.

## Non-goals
- No change to dose recommendations.
- No new medical decision logic.
- No network permission is enabled by default.
