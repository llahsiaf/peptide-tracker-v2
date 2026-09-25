const fs = require('fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [
  ['TodayScreen has one activeVials declaration', (s) => (s.match(/const activeVials\s*=/g) || []).length === 1, 'src/screens/TodayScreen.tsx'],
  ['Analytics utility exists', () => fs.existsSync('src/utils/analyticsUtils.ts'), 'src/utils/analyticsUtils.ts'],
  ['History imports vial analytics', (s) => s.includes("getVialJourneys") && s.includes("getPeptideUsageStats"), 'src/screens/HistoryScreen.tsx'],
  ['History renders Perjalanan Vial', (s) => s.includes('Perjalanan Vial'), 'src/screens/HistoryScreen.tsx'],
  ['History renders usage summary', (s) => s.includes('Ringkasan Penggunaan'), 'src/screens/HistoryScreen.tsx'],
];

let failed = 0;
for (const [label, fn, file] of checks) {
  const result = fn(file && file.endsWith('.ts') || file && file.endsWith('.tsx') ? read(file) : undefined);
  if (result) console.log(`PASS: ${label}`);
  else { console.error(`FAIL: ${label}`); failed += 1; }
}
process.exitCode = failed ? 1 : 0;
