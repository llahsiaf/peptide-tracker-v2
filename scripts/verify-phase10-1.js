const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workflowPath = path.join(
  root,
  ".github",
  "workflows",
  "build-ipa.yml"
);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

if (!fs.existsSync(workflowPath)) {
  fail("GitHub Actions workflow not found: .github/workflows/build-ipa.yml");
  process.exit(1);
}

const workflow = fs.readFileSync(workflowPath, "utf8");

// Normalize whitespace so that commands written across multiple
// YAML lines can still be detected reliably.
const normalized = workflow
  .replace(/\\\r?\n/g, " ")
  .replace(/\r?\n/g, "\n")
  .replace(/[ \t]+/g, " ");

console.log("==========================================");
console.log("PHASE 10.1 WORKFLOW VERIFICATION");
console.log("==========================================");
console.log("");

//
// ------------------------------------------
// BASIC WORKFLOW
// ------------------------------------------
//

if (/workflow_dispatch\s*:/.test(workflow)) {
  pass("workflow_dispatch trigger exists");
} else {
  fail("workflow_dispatch trigger is missing");
}

if (/runs-on:\s*macos-/.test(workflow)) {
  pass("macOS GitHub runner is configured");
} else {
  fail("macOS runner is missing");
}

//
// ------------------------------------------
// NODE
// ------------------------------------------
//

const nodeVersionMatch = workflow.match(
  /node-version:\s*["']?(\d+(?:\.\d+)?)["']?/
);

if (nodeVersionMatch) {
  const nodeVersion = nodeVersionMatch[1];

  pass(`Node.js version configured: ${nodeVersion}`);

  const major = Number(nodeVersion.split(".")[0]);

  if (major >= 20) {
    pass("Node.js version is compatible with the Phase 10.1 pipeline");
  } else {
    fail(
      `Node.js version ${nodeVersion} is older than the supported Phase 10.1 baseline`
    );
  }
} else {
  fail("node-version is not configured");
}

//
// ------------------------------------------
// NPM INSTALL
// ------------------------------------------
//

if (/run:\s*npm install\b/.test(normalized)) {
  pass("npm install exists");
} else if (/run:\s*npm ci\b/.test(normalized)) {
  pass("npm ci exists");
} else {
  fail("No npm install or npm ci command found");
}

//
// ------------------------------------------
// NO NPM CACHE REQUIREMENT
// ------------------------------------------
//

const setupNodeSectionMatch = workflow.match(
  /- name:\s*Setup Node\.js[\s\S]*?(?=\n\s*-\s+name:|\n\s*#|$)/i
);

if (setupNodeSectionMatch) {
  const setupNodeSection = setupNodeSectionMatch[0];

  if (/cache:\s*npm/.test(setupNodeSection)) {
    fail(
      "setup-node still uses cache: npm; remove it to avoid lockfile-cache dependency"
    );
  } else {
    pass("npm cache is not required by setup-node");
  }
} else {
  pass("setup-node cache check skipped");
}

//
// ------------------------------------------
// EXPO PREBUILD
// ------------------------------------------
//

const prebuildPattern =
  /npx\s+expo\s+prebuild\s+--platform\s+ios\s+--clean\s+--non-interactive/i;

if (prebuildPattern.test(normalized)) {
  pass("Expo iOS prebuild command exists");
} else {
  fail(
    "Expo iOS prebuild command is missing: npx expo prebuild --platform ios --clean --non-interactive"
  );
}

//
// ------------------------------------------
// IOS WORKSPACE
// ------------------------------------------
//

if (workflow.includes(".xcworkspace")) {
  pass("Xcode workspace handling exists");
} else {
  fail("No .xcworkspace handling found");
}

//
// ------------------------------------------
// XCODE
// ------------------------------------------
//

if (/xcodebuild\b/.test(workflow)) {
  pass("xcodebuild is used");
} else {
  fail("xcodebuild command is missing");
}

//
// ------------------------------------------
// UNSIGNED BUILD
// ------------------------------------------
//

if (/CODE_SIGNING_ALLOWED=NO/.test(workflow)) {
  pass("CODE_SIGNING_ALLOWED=NO is configured");
} else {
  fail("CODE_SIGNING_ALLOWED=NO is missing");
}

if (/CODE_SIGNING_REQUIRED=NO/.test(workflow)) {
  pass("CODE_SIGNING_REQUIRED=NO is configured");
} else {
  fail("CODE_SIGNING_REQUIRED=NO is missing");
}

//
// ------------------------------------------
// IPA PACKAGING
// ------------------------------------------
//

if (/zip\s+.*\.ipa/i.test(normalized)) {
  pass("IPA packaging step exists");
} else {
  fail("No ZIP/IPA packaging command found");
}

if (/BioStack_PRO_iOS_unsigned\.ipa/i.test(workflow)) {
  pass("Expected unsigned IPA filename exists");
} else {
  fail("Expected BioStack_PRO_iOS_unsigned.ipa filename is missing");
}

//
// ------------------------------------------
// IPA VERIFICATION
// ------------------------------------------
//

if (/Verify IPA Artifact/i.test(workflow)) {
  pass("IPA artifact verification step exists");
} else {
  fail("IPA artifact verification step is missing");
}

//
// ------------------------------------------
// ARTIFACT UPLOAD
// ------------------------------------------
//

if (/actions\/upload-artifact@v4/.test(workflow)) {
  pass("GitHub artifact upload exists");
} else {
  fail("GitHub artifact upload is missing");
}

//
// ------------------------------------------
// BUILD LOG
// ------------------------------------------
//

if (/xcodebuild\.log/.test(workflow)) {
  pass("xcodebuild log artifact exists");
} else {
  fail("xcodebuild.log handling is missing");
}

//
// ------------------------------------------
// EAS SHOULD NOT BE REQUIRED
// ------------------------------------------
//

if (/eas\s+build/i.test(workflow)) {
  fail("Workflow should not use EAS build for the Sideloadly pipeline");
} else {
  pass("Workflow does not depend on EAS build");
}

//
// ------------------------------------------
// APS ENVIRONMENT
// ------------------------------------------
//

if (/aps-environment/.test(workflow)) {
  console.log(
    "WARN: aps-environment entitlement appears in the workflow. " +
    "This pipeline is intended to test local notifications, not APNs push."
  );
} else {
  pass("No manual aps-environment injection");
}

//
// ------------------------------------------
// RESULT
// ------------------------------------------
//

console.log("");

if (process.exitCode) {
  console.log("==========================================");
  console.log("PHASE 10.1 VERIFICATION: FAILED");
  console.log("==========================================");
  process.exit(1);
}

console.log("==========================================");
console.log("PHASE 10.1 VERIFICATION: PASS");
console.log("==========================================");
