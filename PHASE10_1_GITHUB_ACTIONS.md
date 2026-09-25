# Phase 10.1 — GitHub Actions iOS IPA Pipeline

## Goal

Build an unsigned iOS `.ipa` on a GitHub-hosted macOS runner, then download the artifact and use Sideloadly for device installation/signing.

## Pipeline

1. Checkout source.
2. Pin Node.js 20 and enable npm cache.
3. Install from `package-lock.json` with `npm ci`.
4. Run source/Phase 10 verification.
5. Generate the iOS native project with Expo prebuild.
6. Verify that an Xcode workspace and scheme exist.
7. Compile the Release iOS app with code signing disabled.
8. Package the resulting `.app` as an unsigned `.ipa`.
9. Upload the IPA and Xcode log as GitHub Actions artifacts.

## Important

This pipeline does **not** add APNs push entitlements. Phase 10 is testing local notifications, which are scheduled by the app itself.

The output is intentionally unsigned. The next step is to download the artifact from GitHub Actions and provide the `.ipa` to Sideloadly.

## GitHub Actions usage

Open:

`Actions → Build iOS IPA (Sideloadly Ready) → Run workflow`

After a successful run:

`Summary → Artifacts → BioStack-PRO-Sideloadly-<commit>`

Download the artifact ZIP and extract:

`BioStack_PRO_iOS_unsigned.ipa`
