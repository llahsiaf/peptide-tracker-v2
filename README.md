# 🧪 Peptide Tracker v2 (BioStack Pro)

A cheerful, friendly, and precise personal peptide protocol and injection tracking application built with **React Native (Expo)**, **TypeScript**, and **custom SVG vector graphics**.

Designed with a **Vibrant Dark** aesthetic (`#0b0f19` obsidian navy base, rounded bubbly card surfaces, soft neon-pastel accents, and cheerful cartoon illustrations).

---

## ✨ Key Features & Redesign Highlights

### 1. 🎯 Dynamic Vial Depletion & Dose Estimator (*Fitur Unggulan*)
- **Real-Time Remaining Injection Countdown:** Every vial displays exactly how many injection sessions remain (`🎯 Sisa ~X kali suntik (~Y hari lagi)`) based on reconstituted volume, concentration, and prescribed dose.
- **Dynamic Urgency Alerts:**
  - 🟢 **Aman / Safe (>7 dosis):** Fresh mint badge
  - 🟡 **Peringatan / Warning (4-7 dosis):** Sunny amber badge
  - 🔴 **Kritis / Alert (≤3 dosis):** Bubblegum rose alert to restock from freezer or reorder
- **Instant Estimation in Edit Dose Modal:** Sliders and inputs calculate the exact yield of 1 vial on the fly.

### 2. 🎨 Cheerful Cartoon SVG Vector Visuals
- **Cute Vial (`CuteVialIllustration.tsx`):**
  - Rounded chubby cartoon vial design.
  - Realistic wavy animated-feel liquid level reflecting remaining volume percentage.
  - Rising cartoon bubbles and glass reflection shine.
  - Categorized cap color codes (Mint, Aqua, Warm Peach, Lavender, Rose).
  - Powder state for freezer vials.
- **Cute Syringe (`CuteSyringeIllustration.tsx`):**
  - Friendly cartoon U-100 insulin syringe.
  - Plunger level moves dynamically according to calculated IU.
  - Easy-to-read dial tick indicators.
- **Frosty Freezer Badge (`FrostyFreezerBadge.tsx`):**
  - Snow-capped mini freezer illustration with cute ice crystals and stock badge.

### 3. 🏗️ Clean Modular Architecture
- Screen code reduced from monolithic files (3,500+ lines) into clean modular components:
  - `src/components/inventory/InventoryCard.tsx`
  - `src/components/inventory/EditDoseModal.tsx`
  - `src/components/inventory/ScheduleModal.tsx`
  - `src/components/inventory/TakeFromFreezerModal.tsx`
  - `src/components/common/CuteVialIllustration.tsx`
  - `src/components/common/CuteSyringeIllustration.tsx`
  - `src/components/common/FrostyFreezerBadge.tsx`
- Fully typed models in `src/types/index.ts`.

### 4. 💉 Medical & Clinical Precision
- Strict BAC water volume to concentration math (`mg / mL = mg/mL`).
- Precise U-100 syringe conversion (`1 mL = 100 IU`).
- Full support for both comma (`,`) and dot (`.`) decimal separators on mobile keyboards.
- Injection site rotation tracking (Left/Right Abdomen, Thighs, Deltoids).
- Calendar sync export (`.ics` / device calendar).

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Typecheck & audits
npm run typecheck
npm run audit-syntax
npm run verify-phase10-1
```

---

## 📱 Build & Deployment
- Automated continuous deployment via **Netlify** (Web export).
- iOS Unsigned `.ipa` verification workflow ready (`npm run verify-phase10-1`).
