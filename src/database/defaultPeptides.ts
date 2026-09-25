// src/database/defaultPeptides.ts

// ============================================================
// PEPTIDE TYPES
// ============================================================

export type PeptideFrequency =
  | 'daily'
  | 'weekly'
  | '2x_week'
  | '3x_week';

export type PeptideUnit =
  | 'mg'
  | 'mcg'
  | 'mL';


// ============================================================
// TRANSLATION TYPES
// ============================================================

export interface PeptideLocalizedText {
  id: string;
  en: string;
}


// ============================================================
// PEPTIDE TEMPLATE
// ============================================================

export interface PeptideTemplate {
  // ----------------------------------------------------------
  // IDENTITAS
  // ----------------------------------------------------------

  id: string;

  name: string;

  /**
   * Variasi nama yang dapat dikenali oleh autofill.
   *
   * Contoh:
   * aliases: ['BPC-157', 'BPC157']
   */
  aliases: string[];

  // ----------------------------------------------------------
  // INFORMASI PEPTIDE
  // ----------------------------------------------------------

  category: string;

  /**
   * Kategori multibahasa.
   *
   * Field category lama tetap dipertahankan untuk
   * backward compatibility.
   */
  categoryTranslations?: PeptideLocalizedText;

  description: string;

  /**
   * Deskripsi multibahasa.
   *
   * Field description lama tetap dipertahankan untuk
   * backward compatibility.
   */
  descriptionTranslations?: PeptideLocalizedText;

  // ----------------------------------------------------------
  // INFORMASI VIAL
  // ----------------------------------------------------------

  defaultVialSize: number;

  vialUnit: PeptideUnit;

  // ----------------------------------------------------------
  // RECONSTITUTION
  // ----------------------------------------------------------

  defaultBacWater: number;

  // ----------------------------------------------------------
  // DOSIS
  // ----------------------------------------------------------

  targetDose: number;

  doseUnit: PeptideUnit;

  // ----------------------------------------------------------
  // DEFAULT STOCK
  // ----------------------------------------------------------

  defaultStock: number;

  // ----------------------------------------------------------
  // FREQUENCY
  // ----------------------------------------------------------

  frequency: PeptideFrequency;

  frequencyLabel: string;

  // ----------------------------------------------------------
  // PENYIMPANAN
  // ----------------------------------------------------------

  halfLifeDays: number;

  maxFridgeDays: number;

  // ----------------------------------------------------------
  // PRESET DOSIS
  // ----------------------------------------------------------

  presetLow: number;

  presetStandard: number;

  presetHigh: number;

  // ----------------------------------------------------------
  // JADWAL
  // ----------------------------------------------------------

  activeDays: string[];

  injectionTime: string;
}


// ============================================================
// MASTER PEPTIDE DATABASE
// ============================================================
//
// IMPORTANT:
//
// 1. 1 peptide = 1 object.
// 2. Jangan membuat peptide baru di luar data master.
// 3. aliases digunakan hanya untuk membantu pencarian nama.
// 4. category dan description lama dipertahankan agar seluruh
//    aplikasi yang sekarang tetap kompatibel.
// 5. categoryTranslations dan descriptionTranslations akan
//    digunakan oleh sistem multi-language.
// ============================================================

export const DEFAULT_PEPTIDES: PeptideTemplate[] = [

  // ==========================================================
  // RETATRUTIDE
  // ==========================================================

  {
    id: 'retatrutide',

    name: 'Retatrutide',

    aliases: [
      'Reta',
      'RETA',
      'Retatrutide',
    ],

    category:
      'GLP-1 / GIP / GCG Tri-Agonist',

    categoryTranslations: {
      id:
        'GLP-1 / GIP / GCG Tri-Agonist',
      en:
        'GLP-1 / GIP / GCG Triple Agonist',
    },

    description:
      'Triple agonist reseptor metabolik untuk optimalisasi energi dan pengelolaan glukosa.',

    descriptionTranslations: {
      id:
        'Triple agonist reseptor metabolik untuk optimalisasi energi dan pengelolaan glukosa.',
      en:
        'Triple metabolic receptor agonist for energy optimization and glucose regulation.',
    },

    defaultVialSize: 10,

    vialUnit: 'mg',

    defaultBacWater: 1.0,

    targetDose: 2.0,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: 'weekly',

    frequencyLabel:
      'Mingguan (Weekly)',

    halfLifeDays: 6.0,

    maxFridgeDays: 56,

    presetLow: 1.0,

    presetStandard: 2.0,

    presetHigh: 4.0,

    activeDays: ['Sen'],

    injectionTime: '08:00',
  },


  // ==========================================================
  // BPC 157
  // ==========================================================

  {
    id: 'bpc-157',

    name: 'BPC 157',

    aliases: [
      'BPC-157',
      'BPC157',
      'BPC 157',
    ],

    category:
      'Healing & Gut Support',

    categoryTranslations: {
      id:
        'Healing & Gut Support',
      en:
        'Healing & Gut Support',
    },

    description:
      'Peptida regeneratif sintetis untuk percepatan perbaikan mukosa usus, tendon, dan ligamen.',

    descriptionTranslations: {
      id:
        'Peptida regeneratif sintetis untuk percepatan perbaikan mukosa usus, tendon, dan ligamen.',
      en:
        'Synthetic regenerative peptide studied for tissue, gut, tendon, and ligament repair.',
    },

    defaultVialSize: 10,

    vialUnit: 'mg',

    defaultBacWater: 2.0,

    targetDose: 0.5,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: 'daily',

    frequencyLabel:
      'Harian (Daily)',

    halfLifeDays: 0.5,

    maxFridgeDays: 28,

    presetLow: 0.25,

    presetStandard: 0.5,

    presetHigh: 1.0,

    activeDays: [
      'Sen',
      'Sel',
      'Rab',
      'Kam',
      'Jum',
      'Sab',
      'Min',
    ],

    injectionTime: '08:00',
  },


  // ==========================================================
  // CJC + IPA
  // ==========================================================

  {
    id: 'cjc-ipa',

    name: 'CJC + IPA',

    aliases: [
      'CJC+IPA',
      'CJC IPA',
      'CJC-1295 + Ipamorelin',
      'CJC 1295 + Ipamorelin',
    ],

    category:
      'GH Secretagogue & Recovery (GHRH+GHRP)',

    categoryTranslations: {
      id:
        'GH Secretagogue & Recovery (GHRH+GHRP)',
      en:
        'GH Secretagogue & Recovery (GHRH+GHRP)',
    },

    description:
      'Kombinasi sinergis CJC-1295 No DAC dan Ipamorelin untuk memicu pelepasan Growth Hormone alami.',

    descriptionTranslations: {
      id:
        'Kombinasi sinergis CJC-1295 No DAC dan Ipamorelin untuk memicu pelepasan Growth Hormone alami.',
      en:
        'Combination of CJC-1295 No DAC and Ipamorelin associated with growth hormone release.',
    },

    defaultVialSize: 10,

    vialUnit: 'mg',

    defaultBacWater: 2.0,

    targetDose: 0.3,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: 'daily',

    frequencyLabel:
      'Harian (Daily)',

    halfLifeDays: 0.2,

    maxFridgeDays: 28,

    presetLow: 0.15,

    presetStandard: 0.3,

    presetHigh: 0.5,

    activeDays: [
      'Sen',
      'Sel',
      'Rab',
      'Kam',
      'Jum',
      'Sab',
      'Min',
    ],

    injectionTime: '21:00',
  },


  // ==========================================================
  // CAGRILINTIDE
  // ==========================================================

  {
    id: 'cagrilintide',

    name: 'Cagrilintide',

    aliases: [
      'Cagri',
      'Cagrilintide',
    ],

    category:
      'Amylin Analogue / Satiety',

    categoryTranslations: {
      id:
        'Amylin Analogue / Satiety',
      en:
        'Amylin Analogue / Satiety',
    },

    description:
      '',

    descriptionTranslations: {
      id:
        '',
      en:
        '',
    },

    defaultVialSize: 5,
    vialUnit: 'mg',
    defaultBacWater: 2.0,
    targetDose: 0.3,
    doseUnit: 'mg',
    defaultStock: 8,
    frequency: 'weekly',
    frequencyLabel: 'Mingguan (Weekly)',
    halfLifeDays: 7.0,
    maxFridgeDays: 56,
    presetLow: 0,
    presetStandard: 0,
    presetHigh: 0,
    activeDays: ['Sen'],
    injectionTime: '08:00',
  },


  // ==========================================================
  // GHK-Cu
  // ==========================================================

  {
    id: 'ghk-cu',

    name: 'GHK-Cu',

    aliases: [
      'GHK Cu',
      'GHK-CU',
      'GHKCU',
      'Copper Peptide',
    ],

    category:
      'Tissue Repair / Anti-Aging',

    categoryTranslations: {
      id:
        'Tissue Repair / Anti-Aging',
      en:
        'Tissue Repair / Anti-Aging',
    },

    description:
      'Kompleks peptida tembaga untuk sintesis kolagen, elastisitas kulit, dan remodeling jaringan.',

    descriptionTranslations: {
      id:
        'Kompleks peptida tembaga untuk sintesis kolagen, elastisitas kulit, dan remodeling jaringan.',
      en:
        'Copper peptide complex associated with collagen synthesis, skin elasticity, and tissue remodeling.',
    },

    defaultVialSize: 50,

    vialUnit: 'mg',

    defaultBacWater: 3.0,

    targetDose: 2.0,

    doseUnit: 'mg',

    defaultStock: 8,

    frequency: 'daily',

    frequencyLabel:
      'Harian (Daily)',

    halfLifeDays: 0.5,

    maxFridgeDays: 28,

    presetLow: 1.0,

    presetStandard: 2.0,

    presetHigh: 3.0,

    activeDays: [
      'Sen',
      'Sel',
      'Rab',
      'Kam',
      'Jum',
      'Sab',
      'Min',
    ],

    injectionTime: '08:00',
  },


  // ==========================================================
  // KISSPEPTIN
  // ==========================================================

  {
    id: 'kisspeptin',

    name: 'Kisspeptin',

    aliases: [
      'Kiss Peptin',
      'Kisspeptin-10',
      'Kisspeptin 10',
    ],

    category:
      'Hormonal Axis Support',

    categoryTranslations: {
      id:
        'Hormonal Axis Support',
      en:
        'Hormonal Axis Support',
    },

    description:
      'Neuropeptida regulator poros GnRH-LH-FSH untuk mendukung modulasi hormonal endogen.',

    descriptionTranslations: {
      id:
        'Neuropeptida regulator poros GnRH-LH-FSH untuk mendukung modulasi hormonal endogen.',
      en:
        'Neuropeptide involved in regulation of the GnRH-LH-FSH hormonal axis.',
    },

    defaultVialSize: 10,

    vialUnit: 'mg',

    defaultBacWater: 2.0,

    targetDose: 0.2,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: '3x_week',

    frequencyLabel:
      '3x Seminggu',

    halfLifeDays: 0.3,

    maxFridgeDays: 28,

    presetLow: 0.1,

    presetStandard: 0.2,

    presetHigh: 0.4,

    activeDays: [
      'Sen',
      'Rab',
      'Jum',
    ],

    injectionTime: '08:00',
  },


  // ==========================================================
  // MOTS-c
  // ==========================================================

  {
    id: 'mots-c',

    name: 'MOTS-c',

    aliases: [
      'MOTS C',
      'MOTSc',
      'MOTS-C',
    ],

    category:
      'Mitochondrial Energy',

    categoryTranslations: {
      id:
        'Mitochondrial Energy',
      en:
        'Mitochondrial Energy',
    },

    description:
      'Peptida turunan mitokondria untuk metabolisme energi seluler dan sensitivitas insulin.',

    descriptionTranslations: {
      id:
        'Peptida turunan mitokondria untuk metabolisme energi seluler dan sensitivitas insulin.',
      en:
        'Mitochondrial-derived peptide studied in relation to cellular energy metabolism and insulin sensitivity.',
    },

    defaultVialSize: 20,

    vialUnit: 'mg',

    defaultBacWater: 2.0,

    targetDose: 5.0,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: '3x_week',

    frequencyLabel:
      '3x Seminggu',

    halfLifeDays: 0.8,

    maxFridgeDays: 28,

    presetLow: 2.5,

    presetStandard: 5.0,

    presetHigh: 10.0,

    activeDays: [
      'Sen',
      'Rab',
      'Jum',
    ],

    injectionTime: '08:00',
  },


  // ==========================================================
  // LC526
  // ==========================================================

  {
    id: 'lc526',

    name: 'LC526',

    aliases: [
      'LC 526',
    ],

    category:
      'Fat Metabolism & Liver',

    categoryTranslations: {
      id:
        'Fat Metabolism & Liver',
      en:
        'Fat Metabolism & Liver',
    },

    description:
      'Formulasi asam amino lipotropik untuk mendukung pemecahan lemak dan fungsi hati.',

    descriptionTranslations: {
      id:
        'Formulasi asam amino lipotropik untuk mendukung pemecahan lemak dan fungsi hati.',
      en:
        'Lipotropic amino-acid formulation associated with fat metabolism and liver support.',
    },

    defaultVialSize: 10,

    vialUnit: 'mL',

    defaultBacWater: 0.0,

    targetDose: 1.0,

    doseUnit: 'mL',

    defaultStock: 10,

    frequency: 'daily',

    frequencyLabel:
      'Harian (Daily)',

    halfLifeDays: 1.0,

    maxFridgeDays: 60,

    presetLow: 0.5,

    presetStandard: 1.0,

    presetHigh: 2.0,

    activeDays: [
      'Sen',
      'Sel',
      'Rab',
      'Kam',
      'Jum',
      'Sab',
      'Min',
    ],

    injectionTime: '08:00',
  },


  // ==========================================================
  // TIRZEPATIDE
  // ==========================================================

  {
    id: 'tirzepatide',

    name: 'Tirzepatide',

    aliases: [
      'Tirzep',
      'Tirz',
    ],

    category:
      'GLP-1 / GIP Dual Agonist',

    categoryTranslations: {
      id:
        'GLP-1 / GIP Dual Agonist',
      en:
        'GLP-1 / GIP Dual Agonist',
    },

    description:
      'GIP dan GLP-1 receptor dual agonist untuk kontrol nafsu makan dan regulasi glikemik.',

    descriptionTranslations: {
      id:
        'GIP dan GLP-1 receptor dual agonist untuk kontrol nafsu makan dan regulasi glikemik.',
      en:
        'Dual GIP and GLP-1 receptor agonist associated with appetite and glycemic regulation.',
    },

    defaultVialSize: 10,

    vialUnit: 'mg',

    defaultBacWater: 1.0,

    targetDose: 2.5,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: 'weekly',

    frequencyLabel:
      'Mingguan (Weekly)',

    halfLifeDays: 5.0,

    maxFridgeDays: 56,

    presetLow: 2.5,

    presetStandard: 5.0,

    presetHigh: 7.5,

    activeDays: ['Sen'],

    injectionTime: '08:00',
  },


  // ==========================================================
  // SEMAGLUTIDE
  // ==========================================================

  {
    id: 'semaglutide',

    name: 'Semaglutide',

    aliases: [
      'Sema',
      'Semaglutide',
    ],

    category:
      'GLP-1 Receptor Agonist',

    categoryTranslations: {
      id:
        'GLP-1 Receptor Agonist',
      en:
        'GLP-1 Receptor Agonist',
    },

    description:
      'GLP-1 long-acting analog untuk regulasi nafsu makan dan metabolisme glukosa.',

    descriptionTranslations: {
      id:
        'GLP-1 long-acting analog untuk regulasi nafsu makan dan metabolisme glukosa.',
      en:
        'Long-acting GLP-1 analog associated with appetite and glucose metabolism regulation.',
    },

    defaultVialSize: 5,

    vialUnit: 'mg',

    defaultBacWater: 1.0,

    targetDose: 0.5,

    doseUnit: 'mg',

    defaultStock: 10,

    frequency: 'weekly',

    frequencyLabel:
      'Mingguan (Weekly)',

    halfLifeDays: 7.0,

    maxFridgeDays: 56,

    presetLow: 0.25,

    presetStandard: 0.5,

    presetHigh: 1.0,

    activeDays: ['Sen'],

    injectionTime: '08:00',
  },
];


// ============================================================
// NORMALIZE PEPTIDE NAME
// ============================================================
//
// Digunakan agar variasi penulisan seperti:
//
// BPC 157
// BPC-157
// BPC157
//
// dapat diperlakukan sebagai nama yang sama.
// ============================================================

export function normalizePeptideName(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
}


// ============================================================
// FIND PEPTIDE TEMPLATE
// ============================================================

export function findPeptideTemplate(
  input: string,
): PeptideTemplate | undefined {

  const normalizedInput =
    normalizePeptideName(input);

  if (!normalizedInput) {
    return undefined;
  }

  return DEFAULT_PEPTIDES.find(
    (peptide) => {

      const normalizedName =
        normalizePeptideName(
          peptide.name,
        );

      if (
        normalizedName ===
        normalizedInput
      ) {
        return true;
      }

      return peptide.aliases.some(
        (alias) =>
          normalizePeptideName(
            alias,
          ) === normalizedInput,
      );
    },
  );
}


// ============================================================
// GET CATEGORY
// ============================================================

export function getPeptideCategory(
  input: string,
  language: 'id' | 'en' = 'id',
): string | undefined {

  const peptide =
    findPeptideTemplate(input);

  if (!peptide) {
    return undefined;
  }

  if (
    language === 'en' &&
    peptide.categoryTranslations
  ) {
    return peptide
      .categoryTranslations
      .en;
  }

  if (
    language === 'id' &&
    peptide.categoryTranslations
  ) {
    return peptide
      .categoryTranslations
      .id;
  }

  return peptide.category;
}


// ============================================================
// GET DESCRIPTION
// ============================================================

export function getPeptideDescription(
  input: string,
  language: 'id' | 'en' = 'id',
): string | undefined {

  const peptide =
    findPeptideTemplate(input);

  if (!peptide) {
    return undefined;
  }

  if (
    language === 'en' &&
    peptide.descriptionTranslations
  ) {
    return peptide
      .descriptionTranslations
      .en;
  }

  if (
    language === 'id' &&
    peptide.descriptionTranslations
  ) {
    return peptide
      .descriptionTranslations
      .id;
  }

  return peptide.description;
}


// ============================================================
// GET AUTOFILL DATA
// ============================================================
//
// Ini yang nantinya digunakan FreezerScreen.
//
// Jika peptide ditemukan:
//
// category
// description
// vial size
// unit
// BAC Water
// target dose
// frequency
// preset
// schedule
//
// dapat digunakan sebagai nilai awal form.
//
// Setelah masuk ke form, user tetap boleh mengubahnya.
// ============================================================

export function getPeptideAutofillData(
  input: string,
  language: 'id' | 'en' = 'id',
) {

  const peptide =
    findPeptideTemplate(input);

  if (!peptide) {
    return undefined;
  }

  return {
    id: peptide.id,

    name: peptide.name,

    aliases: peptide.aliases,

    category:
      getPeptideCategory(
        input,
        language,
      ) || peptide.category,

    description:
      getPeptideDescription(
        input,
        language,
      ) || peptide.description,

    defaultVialSize:
      peptide.defaultVialSize,

    vialUnit:
      peptide.vialUnit,

    defaultBacWater:
      peptide.defaultBacWater,

    targetDose:
      peptide.targetDose,

    doseUnit:
      peptide.doseUnit,

    defaultStock:
      peptide.defaultStock,

    frequency:
      peptide.frequency,

    frequencyLabel:
      peptide.frequencyLabel,

    halfLifeDays:
      peptide.halfLifeDays,

    maxFridgeDays:
      peptide.maxFridgeDays,

    presetLow:
      peptide.presetLow,

    presetStandard:
      peptide.presetStandard,

    presetHigh:
      peptide.presetHigh,

    activeDays:
      peptide.activeDays,

    injectionTime:
      peptide.injectionTime,
  };
}


// ============================================================
// INJECTION SITE MASTER DATA
// ============================================================
//
// Shared body-map data used by rotation component.
// Dipertahankan dari baseline.
// ============================================================

export const INJECTION_SITES = [
  {
    id: 'KA',
    code: 'KA',
    name: 'Kanan Atas',
    desc: 'Perut kanan atas',
    side: 'right',
    cx: 124,
    cy: 92,
  },

  {
    id: 'KiA',
    code: 'KiA',
    name: 'Kiri Atas',
    desc: 'Perut kiri atas',
    side: 'left',
    cx: 196,
    cy: 92,
  },

  {
    id: 'KB',
    code: 'KB',
    name: 'Kanan Bawah',
    desc: 'Perut kanan bawah',
    side: 'right',
    cx: 124,
    cy: 188,
  },

  {
    id: 'KiB',
    code: 'KiB',
    name: 'Kiri Bawah',
    desc: 'Perut kiri bawah',
    side: 'left',
    cx: 196,
    cy: 188,
  },
];


// ============================================================
// BACKWARD COMPATIBILITY
// ============================================================
//
// Existing components can continue importing:
//
// DEFAULT_PEPTIDES
// MASTER_PEPTIDE_DATABASE
//
// without requiring a broad refactor.
// ============================================================

export const MASTER_PEPTIDE_DATABASE =
  DEFAULT_PEPTIDES;
