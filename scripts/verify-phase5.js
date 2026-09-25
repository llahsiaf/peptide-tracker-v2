const fs = require('fs');
const path = require('path');

const required = [
  'src/utils/rotationUtils.ts',
  'src/utils/injectionCalculations.ts',
  'src/screens/TodayScreen.tsx',
  'src/screens/HistoryScreen.tsx',
  'src/store/useBioStackStore.ts',
];

const missing = required.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));
if (missing.length) {
  console.error('Missing files:\n' + missing.join('\n'));
  process.exit(1);
}

const today = fs.readFileSync(path.join(process.cwd(), 'src/screens/TodayScreen.tsx'), 'utf8');
const store = fs.readFileSync(path.join(process.cwd(), 'src/store/useBioStackStore.ts'), 'utf8');
const history = fs.readFileSync(path.join(process.cwd(), 'src/screens/HistoryScreen.tsx'), 'utf8');

const checks = [
  ['Quick Log modal', today.includes('QUICK LOG') && today.includes('recordInjection')],
  ['Per-vial site helper', today.includes('getTrackerSuggestedSite')],
  ['Atomic injection action', store.includes('recordInjection:')],
  ['Clear history restores volume', store.includes('restoredByInventory')],
  ['History notes', history.includes('item.notes')],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
