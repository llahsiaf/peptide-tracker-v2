# Phase 4 Changelog — Today Dashboard

## Added
- `src/screens/TodayScreen.tsx`
  - Today-first dashboard.
  - Weekly calendar/date selection.
  - Selected-day schedule and injection activity.
  - 7-day upcoming schedule.
  - Inventory/freezer lifecycle counters.
  - 30-day descriptive analytics.
- `src/utils/dashboardUtils.ts`
  - Local-date history filtering.
  - Dashboard analytics aggregation.
  - Schedule status labels.

## Updated
- `App.tsx`
  - Added `Today` as the default landing tab.
  - Added quick navigation from dashboard to Inventory.
  - Retained all existing Inventory/Rotasi/Riwayat/Freezer tabs.

## Verification
- TypeScript/TSX transpile scan: 0 syntax diagnostics.
- Full Expo typecheck still requires installing dependencies locally (`npm install`) because the project archive does not include `node_modules`.
