const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const app = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'src', 'screens', 'SettingsScreen.tsx'), 'utf8');
const store = fs.readFileSync(path.join(root, 'src', 'store', 'useBioStackStore.ts'), 'utf8');
const notifications = fs.readFileSync(path.join(root, 'src', 'utils', 'notificationUtils.ts'), 'utf8');
const checks = [
  ['notification utility exists', fs.existsSync(path.join(root, 'src', 'utils', 'notificationUtils.ts'))],
  ['local schedule uses date trigger', /trigger:\s*\{\s*type:\s*'date'/.test(notifications)],
  ['permission request exists', /requestNotificationPermission/.test(notifications)],
  ['test notification exists', /sendTestNotification/.test(notifications)],
  ['schedule rebuild exists', /rebuildScheduleReminders/.test(notifications)],
  ['notification ids can be persisted', /setNotificationIds/.test(store)],
  ['settings exposes notification diagnostics', /Local Notifications/.test(settings)],
  ['settings exposes test action', /Test 10 dtk/.test(settings)],
  ['settings exposes rebuild action', /Rebuild Reminder 30 Hari/.test(settings)],
  ['app initializes local reminders', /rebuildScheduleReminders\(\s*inventory\s*,\s*30(?:\s*,[^)]*)?\)/.test(app)],
  ['app handles notification taps', /addNotificationResponseReceivedListener/.test(app)],
];

let failed = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${label}`);
  if (!pass) failed++;
}
console.log(`Phase 10 verification: ${failed ? 'FAIL' : 'PASS'}`);
process.exitCode = failed ? 1 : 0;
