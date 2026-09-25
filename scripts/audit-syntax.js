const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let errors = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const source = fs.readFileSync(full, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: full,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
      },
    });
    for (const diagnostic of result.diagnostics || []) {
      if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
      errors += 1;
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      console.error(`${full}: ${message}`);
    }
  }
}

walk(process.cwd());
console.log(`Syntax diagnostics: ${errors}`);
process.exitCode = errors ? 1 : 0;
