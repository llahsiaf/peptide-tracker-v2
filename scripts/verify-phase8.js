const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const checks = [
  ['theme tokens', fs.existsSync(path.join(root, 'src', 'theme.ts'))],
  ['bottom navigation', /navActiveDot/.test(fs.readFileSync(path.join(root, 'App.tsx'), 'utf8'))],
  ['settings remains accessible', /setActiveTab\('settings'\)/.test(fs.readFileSync(path.join(root, 'App.tsx'), 'utf8'))],
  ['AI FAB clears bottom nav', /bottom:\s*92/.test(fs.readFileSync(path.join(root, 'src', 'components', 'FloatingAIChat.tsx'), 'utf8'))],
  ['today screen retained', fs.existsSync(path.join(root, 'src', 'screens', 'TodayScreen.tsx'))],
];
let failed = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${label}`);
  if (!pass) failed++;
}
process.exitCode = failed ? 1 : 0;
