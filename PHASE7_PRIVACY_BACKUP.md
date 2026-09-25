# Phase 7 — Settings, Backup/Restore & Privacy

## Goal
Membuat data tracker pribadi lebih recoverable dan memberi kontrol eksplisit atas koneksi AI online.

## Changes
- Added Settings screen reachable from app header.
- Added full JSON export/import for local tracker state.
- Added backup format/version validation before restore.
- Added explicit restore confirmation.
- Exports do not include AI API keys because keys are stored separately from tracker state.
- Added `allowAiNetwork` privacy switch; default is OFF.
- Floating AI blocks remote requests while privacy switch is OFF.
- Store persisted schema bumped to v5.
- Added `replaceData()` for normalized restore.
- Added `expo-document-picker` dependency.
- Added local data reset with destructive confirmation.

## Important
This backup contains personal tracker data. Store exported JSON in a secure location. Restore replaces current local tracker data.
