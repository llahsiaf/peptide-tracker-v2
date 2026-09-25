# 🧪 BioStack PRO

> **Precision Personal Peptide Protocol Tracker & Smart Ingestion Manager**  
> *100% Local-First • Offline-Ready • Zero Tracking • Cheerful Scientific Design*

BioStack PRO is a modern, high-precision personal peptide protocol and injection tracking application built with **React Native (Expo SDK 51)**, **TypeScript**, and **custom SVG vector graphics**.

Crafted with a luxurious **Warm Espresso & Burnished Amber** aesthetic, BioStack PRO combines clinical dosing accuracy with charming, playful vector illustrations — turning peptide regimen management into an effortless, delightful daily ritual.

---

## ✨ Highlights & Key Features

### 1. 🎨 Dual-Tone Cartoon Vector Illustrations
- **Cute Illustrated Vials (`CuteVialIllustration.tsx`):**
  - High-fidelity 25-color deterministic palette matched to peptide names.
  - **Dual-tone flip-off caps:** Rubber flip-off caps and liquids use vibrant, harmoniously contrasting color pairings (e.g. Emerald liquid with Sunset Coral cap, Amethyst liquid with Amber Gold cap).
  - **Lyophilized Powder vs. Liquid State:** Freezer vials display white freeze-dried cake with crystalline frost sparkles; reconstituted fridge vials display animated-feel wavy liquid with rising bubbles and dosage ticks.
- **Friendly U-100 Syringe (`CuteSyringeIllustration.tsx`):**
  - Cartoon insulin syringe with a dynamic plunger that moves to the exact calculated IU mark.
- **Frosty Freezer & Cheerful History Badges:**
  - Snow-capped mini freezer and cheerful golden pocket-watch logbook badges.

---

### 2. 📱 4 Core Management Tabs

#### 📅 **Today Screen (Daily Timeline & Feed)**
- **Interactive Calendar Strip:** Weekly horizontal picker with quick Jump-to-Today.
- **Accurate Schedule Status:** Automatically identifies occurrences as `Upcoming`, `Due` (active 3-hour window), `Missed`, or `Completed`. Future dates are cleanly kept as `Upcoming`.
- **One-Tap Quick Log:** Fast dose logging with auto-calculated volume, IU, and site suggestion.
- **Upcoming Injections Stream:** Clean chronological preview of scheduled doses for the next 7 days.

#### 🧪 **Inventory Screen (Active Fridge Stock)**
- **Sleek, Compact Cards:** Designed for high-density daily protocols (supports 8+ peptides/day without scrolling fatigue).
- **Formula A Active Days:** 7 micro-chips (`M T W T F S S`) with instant visual feedback and current-day highlights.
- **Real-Time Shots Left Countdown:** Shows exact remaining injections and estimated days remaining (`X Shots Left (~Yd) • Z / W mL`).
- **Inline Dosing Metrics:** Live readout of target dose, U-100 IU, and injection volume (mL).
- **Vial Controls:** Quick log dose, pause/resume schedule, edit protocol, and sync to device calendar.

#### 📜 **History Screen (Dosing Logs & Vial Journeys)**
- **Dual-Mode Records:** Switch seamlessly between individual Injection Logs and comprehensive Vial Journeys.
- **Vial Lifecycle Tracker:** Monitors total volume logged, progress percentage, and completed dates per vial.
- **Data Portability:** One-click CSV export (`.csv`) for sharing with healthcare professionals or personal archival.

#### ❄️ **Freezer Screen (Lyophilized Stock Vault)**
- **Powder Inventory:** Track freeze-dried stock vials (`mg` or `mcg`) safely in long-term storage.
- **Reconstitution Wizard:** Step-by-step calculator that computes BAC water volume, target concentration, and seamlessly transfers the reconstituted vial to the active fridge.

---

### 3. 🧮 Built-in Quick Dosing Calculator
- Accessible anywhere from the header launcher.
- Instantly solves the peptide math triangle:
  $$\text{Volume per Dose (mL)} = \frac{\text{Target Dose}}{\text{Concentration (mg/mL)}}$$
  $$\text{U-100 Units (IU)} = \text{Volume (mL)} \times 100$$
- Includes dial-click calculations (for pen devices: 1 click = 0.01 mL = 1 IU).

---

### 4. 🔒 Privacy & Local-First Philosophy
- **100% Offline-First:** All inventory, protocols, and injection logs are stored strictly on-device via `AsyncStorage`.
- **Zero Cloud / Zero Tracking:** No third-party analytics, no tracking cookies, and no cloud server dependencies.
- **Full Backup & Restore:** Complete JSON import and export functionality to safeguard your protocol data.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [React Native](https://reactnative.dev/) (v0.74.1) with [Expo](https://expo.dev/) (SDK 51)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict typing, 0 type errors)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) with persistent storage
- **Vector Graphics:** [react-native-svg](https://github.com/software-mansion/react-native-svg)
- **Icons:** [Lucide React Native](https://lucide.dev/)
- **Theme:** Warm Espresso Dark System (`#1a100f`, `#231716`, `#DF8A3A`, `#c2d3b6`)

### Project Structure

```
peptide-tracker-v2/
├── App.tsx                     # Main layout with Command Center & Island Dock
├── src/
│   ├── components/
│   │   ├── common/             # SVG illustrations & badges
│   │   │   ├── CuteVialIllustration.tsx
│   │   │   ├── CuteSyringeIllustration.tsx
│   │   │   ├── FrostyFreezerBadge.tsx
│   │   │   └── CheerfulHistoryBadge.tsx
│   │   └── inventory/          # Modular inventory components & modals
│   │       ├── InventoryCard.tsx
│   │       ├── EditDoseModal.tsx
│   │       ├── ScheduleModal.tsx
│   │       └── TakeFromFreezerModal.tsx
│   ├── screens/                # Core application screens
│   │   ├── TodayScreen.tsx
│   │   ├── InventoryScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── FreezerScreen.tsx
│   ├── store/
│   │   └── useBioStackStore.ts # Central Zustand store with persistence
│   ├── utils/                  # Medical calculations & schedule logic
│   │   ├── injectionCalculations.ts
│   │   ├── scheduleUtils.ts
│   │   ├── analyticsUtils.ts
│   │   └── rotationUtils.ts
│   ├── theme/                  # Design tokens & color constants
│   └── types/                  # TypeScript interface definitions
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Expo Go](https://expo.dev/go) app (for running on physical iOS/Android devices)

### Installation

```bash
# Clone the repository
git clone https://github.com/llahsiaf/peptide-tracker-v2.git
cd peptide-tracker-v2

# Install dependencies
npm install
```

### Running the App

```bash
# Start the Expo development server
npx expo start

# Run on Web directly
npx expo start --web

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

### Verification & Quality Checks

```bash
# Run TypeScript typechecker
npm run typecheck

# Run syntax diagnostics audit
npm run audit-syntax

# Export web production bundle
npx expo export --platform web
```

---

## 📄 License

This project is licensed under the **MIT License**.
