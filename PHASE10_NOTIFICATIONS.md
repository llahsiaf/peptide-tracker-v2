# Phase 10 — Local Notification Engine

Phase 10 adds a device-local reminder layer for BioStack.

## Goals
- Use iOS local notifications instead of push notifications.
- Provide permission diagnostics from Settings.
- Provide a short diagnostic test notification.
- Rebuild schedule reminders for the next 30 days.
- Persist scheduled notification IDs per inventory item.
- Keep the tracker usable when notifications are unavailable.
- Navigate to Today when the user taps a BioStack notification.

## Behavior
The app requests notification permission at startup as in the previous baseline. When permission is granted, the app rebuilds future BioStack schedule reminders.

The Settings screen also exposes:
- current authorization status;
- scheduled reminder count;
- "Aktifkan & Jadwalkan";
- "Test 10 dtk";
- "Rebuild Reminder 30 Hari".

Only future occurrences of active, non-empty, non-archived, non-paused schedules with `isReminderActive !== false` are scheduled.

## Privacy
These reminders are local to the device. No notification server or remote push token is required.

Notification content is intentionally generic. It identifies the tracked peptide name and scheduled time, but does not contain dosing instructions.

## Important validation
Full Expo/TypeScript validation should still be run on the Windows development machine after `npm install`.

Suggested test:
1. Build and install the Phase 10 IPA with the same Sideloadly workflow used for BioStack.
2. Open Settings → Local Notifications.
3. Confirm iOS permission shows `Authorized`.
4. Tap `Test 10 dtk`.
5. Lock the iPhone and wait.
6. Tap `Rebuild Reminder 30 Hari`.
7. Confirm the scheduled reminder count is greater than zero when there are active schedules.
8. Change a schedule time, then rebuild and confirm the count updates.

If test notifications do not appear on the sideloaded build, verify iOS notification permission and the signing/entitlement behavior of the installed build before assuming the scheduling code is broken.
