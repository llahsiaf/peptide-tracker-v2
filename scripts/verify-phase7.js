const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (ok, msg) => {
  if (!ok) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
};

assert(fs.existsSync(path.join(root, 'src/screens/SettingsScreen.tsx')), 'Settings screen exists');
assert(fs.existsSync(path.join(root, 'src/utils/backupUtils.ts')), 'Backup utility exists');
assert(read('src/store/useBioStackStore.ts').includes('replaceData'), 'Store exposes safe replaceData action');
assert(read('src/store/useBioStackStore.ts').includes('allowAiNetwork: false'), 'AI network permission defaults OFF');
assert(/version:\s*[5-9]\b/.test(read('src/store/useBioStackStore.ts')), 'Persisted schema bumped to v5 or higher');
assert(read('src/screens/SettingsScreen.tsx').includes('DocumentPicker.getDocumentAsync'), 'Restore uses system document picker');
assert(read('src/screens/SettingsScreen.tsx').includes('API key AI tidak ikut'), 'Backup privacy note excludes API key');
assert(read('src/components/FloatingAIChat.tsx').includes('allowAiNetwork'), 'AI respects privacy network setting');
assert(read('App.tsx').includes('<SettingsScreen'), 'Settings reachable from main app');
console.log('Phase 7 verification: PASS');
