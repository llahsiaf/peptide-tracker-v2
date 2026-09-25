const fs = require('fs');
const path = require('path');

let failures = 0;
function expect(condition, message) {
  if (condition) console.log(`PASS: ${message}`);
  else { console.error(`FAIL: ${message}`); failures += 1; }
}

const analyticsScreen = fs.readFileSync(path.join(process.cwd(), 'src/screens/AnalyticsScreen.tsx'), 'utf8');
const analyticsUtils = fs.readFileSync(path.join(process.cwd(), 'src/utils/analyticsUtils.ts'), 'utf8');
const scheduleUtils = fs.readFileSync(path.join(process.cwd(), 'src/utils/scheduleUtils.ts'), 'utf8');
const app = fs.readFileSync(path.join(process.cwd(), 'App.tsx'), 'utf8');

expect(fs.existsSync(path.join(process.cwd(), 'src/screens/AnalyticsScreen.tsx')), 'Analytics screen exists');
expect(analyticsScreen.includes('RANGE_OPTIONS = [14, 30, 60]'), 'Analytics range filters exist');
expect(analyticsScreen.includes('Aktivitas Harian'), 'Daily activity chart exists');
expect(analyticsScreen.includes('Timeline Vial'), 'Vial timeline exists');
expect(analyticsUtils.includes('getPeptideDailyActivity'), 'Peptide daily analytics helper exists');
expect(scheduleUtils.includes('getScheduledOccurrencesBetween'), 'Historical schedule range helper exists');
expect(app.includes("activeTab === 'analytics'"), 'Analytics route exists');
expect(app.includes('Buka analytics'), 'Analytics header action exists');

console.log(`Phase 9 verification: ${failures ? 'FAIL' : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
