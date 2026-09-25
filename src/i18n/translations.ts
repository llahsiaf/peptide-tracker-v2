// src/i18n/translations.ts

// ============================================================
// BIOSTACK INTERNATIONALIZATION
// ============================================================
//
// Supported languages:
// - id = Bahasa Indonesia
// - en = English
//
// This file is intentionally standalone so the existing screens
// do not need to be refactored all at once.
//
// Future screens can gradually migrate:
//
//   t('freezer.addPeptide')
//
// without changing application logic.
// ============================================================


// ============================================================
// TYPES
// ============================================================

export type SupportedLanguage =
  | 'id'
  | 'en';

export type TranslationValue =
  | string
  | TranslationTree;

export interface TranslationTree {
  [key: string]: TranslationValue;
}


// ============================================================
// DEFAULT LANGUAGE
// ============================================================

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';


// ============================================================
// TRANSLATIONS — INDONESIA
// ============================================================

export const ID_TRANSLATIONS = {

  // ----------------------------------------------------------
  // APP
  // ----------------------------------------------------------

  app: {
    name: 'BioStack',
    loading: 'Memuat...',
    save: 'Simpan',
    cancel: 'Batal',
    close: 'Tutup',
    back: 'Kembali',
    delete: 'Hapus',
    edit: 'Edit',
    confirm: 'Konfirmasi',
    yes: 'Ya',
    no: 'Tidak',
    done: 'Selesai',
    search: 'Cari',
    next: 'Berikutnya',
    previous: 'Sebelumnya',
    today: 'Hari Ini',
  },


  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  navigation: {
    today: 'Today',
    inventory: 'Inventory',
    freezer: 'Freezer',
    history: 'History',
    analytics: 'Analytics',
    rotation: 'Rotasi',
    settings: 'Pengaturan',
  },


  // ----------------------------------------------------------
  // FREEZER
  // ----------------------------------------------------------

  freezer: {

    title:
      'Freezer Lyophilized Stock',

    subtitle:
      'Stok peptida lyophilized yang tersimpan',

    stockSummary:
      '{{compounds}} Senyawa • {{vials}} Vial',

    protectedStock:
      'Vial Padat Terkunci',

    addPeptide:
      'Tambah Peptida Baru',

    searchPlaceholder:
      'Cari peptida dalam freezer...',

    noResults:
      'Tidak Ditemukan Peptida',

    noResultsDescription:
      'Tidak ada stok freezer yang cocok dengan pencarian.',

    category:
      'Kategori / Deskripsi Medis',

    peptideName:
      'Nama Peptida / Senyawa',

    categoryShort:
      'Kategori',

    namePlaceholder:
      'Contoh: Semaglutide',

    autofillPlaceholder:
      'Terisi otomatis jika peptide dikenali',

    vialUnitLabel:
      'Vial',

    vialSize:
      'Ukuran Vial',

    unit:
      'Satuan',

    quantity:
      'Jumlah Stok (Vial)',

    bacWater:
      'Default BAC Water (mL)',

    targetDose:
      'Target Dosis Default',

    frequency:
      'Frequency',

    halfLife:
      'Half Life (Hari)',

    maxFridgeDays:
      'Maks. Hari di Kulkas',

    description:
      'Deskripsi',

    addModalTitle:
      'Tambah Peptida ke Freezer',

    addModalSubtitle:
      'Masukkan data peptida',

    saveToFreezer:
      'Simpan ke Freezer',

    formHint:
      'Data yang dikenali dari master database akan terisi otomatis dan tetap dapat diedit.',

    autoFilled:
      'Terisi otomatis',

    manual:
      'Input manual',

    unknownPeptide:
      'Peptida belum dikenali',

    unknownPeptideDescription:
      'Peptida ini belum tersedia di master database. Silakan isi data secara manual.',

    dissolveToFridge:
      'Larutkan ke Kulkas',

    moveToFridge:
      'Pindahkan ke Kulkas',

    stockEmpty:
      'Stok Habis',

    stockEmptyDescription:
      'Stok {{name}} di freezer sudah 0.',

    transferTitle:
      'Pindahkan ke Kulkas',

    transferSuccess:
      '{{name}} berhasil dipindahkan ke kulkas aktif.',

    reconstitutionTitle:
      'Pelarutan Peptida',

    reconstitutionDescription:
      'Masukkan volume BAC Water untuk melarutkan vial.',

    reconstitutionSuccess:
      'Pelarutan Selesai',

    reconstitutionSuccessDescription:
      '1 vial {{name}} berhasil diproses dan dimasukkan ke kulkas aktif.',
  },


  // ----------------------------------------------------------
  // INVENTORY
  // ----------------------------------------------------------

  inventory: {

    title:
      'Inventory Kulkas Aktif',

    subtitle:
      'Peptida aktif yang tersimpan di kulkas',

    active:
      'Aktif',

    empty:
      'Kosong',

    activeVial:
      'Vial Aktif',

    emptyVial:
      'Vial Kosong',

    freezerStock:
      'Stok Freezer',

    frozenVial:
      'Vial Beku',

    todaySchedule:
      'Jadwal Hari Ini',

    missed:
      'terlewat',

    due:
      'perlu dicatat',

    completed:
      'selesai',

    takeVial:
      'Ambil Vial',

    injectNow:
      'Suntik Sekarang',

    restDay:
      'Hari Rest',

    injectionToday:
      'Injeksi Hari Ini',

    schedulePaused:
      'Jadwal Dijeda',

    dose:
      'Dosis',

    syringe:
      'Spuit',

    dial:
      'Dial',

    days:
      'Hari',

    nextSchedule:
      'Jadwal berikutnya',

    todayCompleted:
      'Hari ini selesai',

    missedSchedule:
      'Terlewat',

    remainingLiquid:
      'Sisa Cairan',

    safeCapacity:
      'Kapasitas Aman',

    dissolved:
      'Dilarutkan',

    fridgeExpiry:
      'Exp Kulkas',

    deleteVial:
      'Hapus Vial',

    deleteVialConfirmation:
      'Hapus {{name}} dari Inventory? Riwayat pencatatan tetap disimpan.',

    doseCalculator:
      'Kalkulator Dosis',

    quickDosePreset:
      'PRESET DOSIS CEPAT',

    low:
      'LOW',

    standard:
      'STANDARD',

    high:
      'HIGH',

    injectionDose:
      'Target Dosis Injeksi',

    solventVolume:
      'Volume Pelarut (BAC Water)',

    syringeSimulation:
      'SIMULASI SPUIT U-100',

    precisionCalculation:
      'HASIL KALKULASI PRESISI',

    volume:
      'Volume',

    syringeU100:
      'Spuit U-100',

    dialPen:
      'Dial Pen',

    applySaveDose:
      'Terapkan & Simpan Dosis',

    scheduleSettings:
      'Jadwal & Pengaturan',

    scheduleSettingsSubtitle:
      'Atur hari, waktu, siklus, dan pengingat',

    frequencySection:
      'FREKUENSI',

    activeDaysSection:
      'HARI AKTIF',

    injectionTime:
      'WAKTU PENYUNTIKAN',

    cycle:
      'Siklus / Periodisasi',

    notifications:
      'Pengingat notifikasi',

    saveSchedule:
      'Simpan Jadwal',

    noActiveVials:
      'Belum Ada Vial Aktif',

    noEmptyVials:
      'Belum Ada Vial Kosong',
  },


  // ----------------------------------------------------------
  // HISTORY
  // ----------------------------------------------------------

  history: {

    title:
      'Riwayat',

    all:
      'Semua',

    today:
      'Hari Ini',

    week:
      'Minggu Ini',

    month:
      'Bulan Ini',

    peptide:
      'Peptida',

    dose:
      'Dosis',

    volume:
      'Volume',

    site:
      'Lokasi',

    time:
      'Waktu',

    noRecords:
      'Belum Ada Riwayat',

    noRecordsDescription:
      'Belum ada pencatatan injeksi.',
  },


  // ----------------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------------

  analytics: {

    title:
      'Analytics',

    overview:
      'Overview',

    adherence:
      'Kepatuhan',

    injections:
      'Injeksi',

    total:
      'Total',

    completed:
      'Selesai',

    missed:
      'Terlewat',

    trend:
      'Tren',

    noData:
      'Belum Ada Data',

    noDataDescription:
      'Data akan muncul setelah pencatatan tersedia.',
  },


  // ----------------------------------------------------------
  // ROTATION
  // ----------------------------------------------------------

  rotation: {

    title:
      'Rotasi Lokasi',

    currentSite:
      'Lokasi Saat Ini',

    suggestedSite:
      'Lokasi Berikutnya',

    abdomen:
      'Perut',

    rightUpper:
      'Kanan Atas',

    leftUpper:
      'Kiri Atas',

    rightLower:
      'Kanan Bawah',

    leftLower:
      'Kiri Bawah',

    next:
      'Berikutnya',

    history:
      'Riwayat Rotasi',

    noLog:
      'Belum pernah disuntik',
  },


  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  settings: {
    title:
      'Pengaturan BioStack',

    subtitle:
      'Backup, privacy, dan kontrol data lokal.',

    language:
      'Bahasa',

    languageDescription:
      'Pilih bahasa aplikasi',

    indonesian:
      'Bahasa Indonesia',

    english:
      'English',

    notifications:
      'Notifikasi',

    exportAllData:
      'Ekspor seluruh data',

    exportAllDataDesc:
      'Membuat satu file JSON berisi inventory, freezer, history, rotasi, dan pengaturan tracker.',

    exportBackup:
      'Ekspor Backup',

    restoreFromBackup:
      'Restore dari backup',

    restoreFromBackupDesc:
      'Pilih file BioStack JSON untuk mengganti data lokal dengan checkpoint yang kamu simpan.',

    pickFile:
      'Pilih File',

    restoreWarning:
      'Restore akan mengganti data lokal saat ini. Ekspor backup terbaru sebelum melakukan restore.',

    notificationHint:
      'BioStack memakai local notifications. Tidak membutuhkan server atau push notification; reminder dibuat dari schedule yang tersimpan di perangkat.',

    appearance:
      'Tampilan',

    data:
      'Data',

    about:
      'Tentang',

    version:
      'Versi',

    languageChanged:
      'Bahasa aplikasi berhasil diubah.',
  },


  // ----------------------------------------------------------
  // COMMON ALERTS
  // ----------------------------------------------------------

  alerts: {

    warning:
      'Peringatan',

    success:
      'Sukses',

    error:
      'Error',

    invalidCalculation:
      'Kalkulasi Tidak Valid',

    insufficientLiquid:
      'Cairan Tidak Cukup',

    failedToRecord:
      'Gagal Mencatat',

    pleaseCheckData:
      'Periksa kembali data yang dimasukkan.',

    tryAgain:
      'Silakan coba lagi.',

    delete:
      'Hapus',

    deleteConfirmation:
      'Apakah kamu yakin ingin menghapus item ini?',
  },


  // ----------------------------------------------------------
  // FREQUENCY
  // ----------------------------------------------------------

  frequency: {

    daily:
      'Harian (Daily)',

    twiceWeekly:
      '2x Seminggu',

    threeTimesWeekly:
      '3x Seminggu',

    weekly:
      'Mingguan (Weekly)',

    everyDay:
      'Setiap Hari',

    mondayThursday:
      'Sen, Kam',

    mondayWednesdayFriday:
      'Sen, Rab, Jum',

    monday:
      'Sen',
  },


  // ----------------------------------------------------------
  // GENERAL STATUS
  // ----------------------------------------------------------

  status: {

    active:
      'Aktif',

    inactive:
      'Tidak Aktif',

    empty:
      'Kosong',

    paused:
      'Dijeda',

    completed:
      'Selesai',

    pending:
      'Menunggu',

    missed:
      'Terlewat',
  },


  // ----------------------------------------------------------
  // CALCULATOR
  // ----------------------------------------------------------

  calculator: {
    title: 'Kalkulator Dosis Presisi',
    subtitle: 'Simulasi dosis, pelarut BAC, dan spuit U-100 secara generik',
    vialSizeLabel: 'Ukuran Vial',
    bacWaterLabel: 'Volume Pelarut (BAC Water)',
    targetDoseLabel: 'Target Dosis',
    resultTitle: 'Hasil Kalkulasi Presisi',
    volumeToInject: 'Volume Injeksi',
    volumeSub: 'Cairan yang disedot',
    syringeMarking: 'Garis Spuit U-100',
    syringeSub: 'Tanda unit spuit insulin',
    syringeVisualizerLabel: 'Visualisasi Spuit U-100',
    concentration: 'Konsentrasi Larutan',
    totalDosesInVial: 'Total Dosis per Vial',
    dosesUnit: 'dosis',
    summaryFormula: 'Vial {{vial}} dilarutkan {{bac}} → Dosis {{dose}} butuh {{vol}} ({{iu}})',
    resetValues: 'Reset ke Default',
  },


  // ----------------------------------------------------------
  // ROTATION SITES
  // ----------------------------------------------------------

  rotationSites: {
    KA: 'Kanan Atas',
    KiA: 'Kiri Atas',
    KB: 'Kanan Bawah',
    KiB: 'Kiri Bawah',
    PKi: 'Paha Kiri',
    PKn: 'Paha Kanan',
    LKi: 'Lengan Kiri',
    LKn: 'Lengan Kanan',
    BKi: 'Bokong Kiri',
    BKn: 'Bokong Kanan',
    abdomen: 'Perut (Abdomen)',
    thigh: 'Paha Depan',
    arm: 'Lengan Atas',
    glute: 'Bokong Luar',
  },


  // ----------------------------------------------------------
  // TODAY
  // ----------------------------------------------------------

  today: {
    title: 'Jadwal Hari Ini',
    subtitle: 'Pantau dan catat jadwal injeksi harian Anda',
    noSchedule: 'Belum Ada Jadwal Hari Ini',
    noScheduleSub: 'Semua injeksi terjadwal sudah dicatat atau hari ini adalah hari istirahat (Rest Day).',
    goToInventory: 'Buka Inventory Kulkas',
    quickLog: 'Quick Log',
    quickLogModal: 'QUICK LOG',
    quickLogSubtitle: 'Catat injeksi cepat dan perbarui sisa vial',
    selectSite: 'Pilih Lokasi Injeksi',
    currentRotation: 'Rekomendasi Rotasi',
    optionalNote: 'Catatan Opsional (cth: reaksi, waktu tidur)',
    confirmLog: 'Konfirmasi Injeksi',
    completedToday: 'Selesai Hari Ini',
    missedSchedule: 'Jadwal Terlewat',
    dueSchedule: 'Jadwal Hari Ini',
    injectNow: 'Suntik Sekarang',
    restDay: 'Hari Istirahat',
    scheduledTime: 'Waktu Jadwal',
    dosesLeft: 'Sisa Dosis',
    daysLeft: 'Hari Tersisa',
    successRecord: 'Injeksi Berhasil Dicatat',
    liquidUpdated: 'Sisa cairan vial otomatis diperbarui.',
  },


  // ----------------------------------------------------------
  // CHAT ASSISTANT
  // ----------------------------------------------------------

  chat: {
    title: 'BioStack AI Assistant',
    subtitle: 'Asisten cerdas kalkulasi peptida & protokol lokal',
    offlineMode: 'Mode Offline (Lokal)',
    onlineMode: 'Mode Online (Gemini AI)',
    inputPlaceholder: 'Tanyakan tentang dosis, kalkulasi, spuit...',
    welcomeMessage: 'Halo! Saya asisten BioStack Anda. Tanyakan kalkulasi spuit, konversi mg ke mcg, atau panduan rotasi injeksi.',
    disclaimer: 'Catatan: Informasi kalkulasi ini untuk pencatatan pribadi dan bukan saran medis formal.',
  },

} as const;


// ============================================================
// TRANSLATIONS — ENGLISH
// ============================================================

export const EN_TRANSLATIONS = {

  app: {
    name: 'BioStack',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    done: 'Done',
    search: 'Search',
    next: 'Next',
    previous: 'Previous',
    today: 'Today',
  },


  navigation: {
    today: 'Today',
    inventory: 'Inventory',
    freezer: 'Freezer',
    history: 'History',
    analytics: 'Analytics',
    rotation: 'Rotation',
    settings: 'Settings',
  },


  freezer: {

    title:
      'Lyophilized Freezer Stock',

    subtitle:
      'Stored lyophilized peptide stock',

    stockSummary:
      '{{compounds}} Compounds • {{vials}} Vials',

    protectedStock:
      'Locked Solid Vials',

    addPeptide:
      'Add New Peptide',

    searchPlaceholder:
      'Search peptides in freezer...',

    noResults:
      'No Peptides Found',

    noResultsDescription:
      'No freezer stock matches your search.',

    category:
      'Medical Category / Description',

    peptideName:
      'Peptide / Compound Name',

    categoryShort:
      'Category',

    namePlaceholder:
      'Example: Semaglutide',

    autofillPlaceholder:
      'Filled automatically when the peptide is recognized',

    vialUnitLabel:
      'Vial',

    vialSize:
      'Vial Size',

    unit:
      'Unit',

    quantity:
      'Stock Quantity (Vials)',

    bacWater:
      'Default BAC Water (mL)',

    targetDose:
      'Default Target Dose',

    frequency:
      'Frequency',

    halfLife:
      'Half Life (Days)',

    maxFridgeDays:
      'Max Fridge Days',

    description:
      'Description',

    addModalTitle:
      'Add Peptide to Freezer',

    addModalSubtitle:
      'Enter peptide information',

    saveToFreezer:
      'Save to Freezer',

    formHint:
      'Recognized master database data will be filled automatically and can still be edited.',

    autoFilled:
      'Auto-filled',

    manual:
      'Manual input',

    unknownPeptide:
      'Peptide not recognized',

    unknownPeptideDescription:
      'This peptide is not available in the master database. Please enter the data manually.',

    dissolveToFridge:
      'Reconstitute to Fridge',

    moveToFridge:
      'Move to Fridge',

    stockEmpty:
      'Out of Stock',

    stockEmptyDescription:
      '{{name}} has no remaining freezer stock.',

    transferTitle:
      'Move to Fridge',

    transferSuccess:
      '{{name}} was successfully moved to active fridge inventory.',

    reconstitutionTitle:
      'Peptide Reconstitution',

    reconstitutionDescription:
      'Enter the BAC Water volume used to reconstitute the vial.',

    reconstitutionSuccess:
      'Reconstitution Complete',

    reconstitutionSuccessDescription:
      '1 vial of {{name}} was processed and added to active fridge inventory.',
  },


  inventory: {

    title:
      'Active Fridge Inventory',

    subtitle:
      'Active peptides stored in the fridge',

    active:
      'Active',

    empty:
      'Empty',

    activeVial:
      'Active Vial',

    emptyVial:
      'Empty Vial',

    freezerStock:
      'Freezer Stock',

    frozenVial:
      'Frozen Vials',

    todaySchedule:
      'Today’s Schedule',

    missed:
      'missed',

    due:
      'due to record',

    completed:
      'completed',

    takeVial:
      'Take Vial',

    injectNow:
      'Inject Now',

    restDay:
      'Rest Day',

    injectionToday:
      'Injection Today',

    schedulePaused:
      'Schedule Paused',

    dose:
      'Dose',

    syringe:
      'Syringe',

    dial:
      'Dial',

    days:
      'Days',

    nextSchedule:
      'Next schedule',

    todayCompleted:
      'Completed today',

    missedSchedule:
      'Missed',

    remainingLiquid:
      'Remaining Liquid',

    safeCapacity:
      'Safe Capacity',

    dissolved:
      'Reconstituted',

    fridgeExpiry:
      'Fridge Exp.',

    deleteVial:
      'Delete Vial',

    deleteVialConfirmation:
      'Delete {{name}} from Inventory? Recording history will be preserved.',

    doseCalculator:
      'Dose Calculator',

    quickDosePreset:
      'QUICK DOSE PRESETS',

    low:
      'LOW',

    standard:
      'STANDARD',

    high:
      'HIGH',

    injectionDose:
      'Injection Target Dose',

    solventVolume:
      'Solvent Volume (BAC Water)',

    syringeSimulation:
      'U-100 SYRINGE SIMULATION',

    precisionCalculation:
      'PRECISION CALCULATION',

    volume:
      'Volume',

    syringeU100:
      'U-100 Syringe',

    dialPen:
      'Dial Pen',

    applySaveDose:
      'Apply & Save Dose',

    scheduleSettings:
      'Schedule & Settings',

    scheduleSettingsSubtitle:
      'Configure days, time, cycle, and reminders',

    frequencySection:
      'FREQUENCY',

    activeDaysSection:
      'ACTIVE DAYS',

    injectionTime:
      'INJECTION TIME',

    cycle:
      'Cycle / Periodization',

    notifications:
      'Notification Reminder',

    saveSchedule:
      'Save Schedule',

    noActiveVials:
      'No Active Vials',

    noEmptyVials:
      'No Empty Vials',
  },


  history: {

    title:
      'History',

    all:
      'All',

    today:
      'Today',

    week:
      'This Week',

    month:
      'This Month',

    peptide:
      'Peptide',

    dose:
      'Dose',

    volume:
      'Volume',

    site:
      'Site',

    time:
      'Time',

    noRecords:
      'No History Yet',

    noRecordsDescription:
      'No injections have been recorded yet.',
  },


  analytics: {

    title:
      'Analytics',

    overview:
      'Overview',

    adherence:
      'Adherence',

    injections:
      'Injections',

    total:
      'Total',

    completed:
      'Completed',

    missed:
      'Missed',

    trend:
      'Trend',

    noData:
      'No Data Yet',

    noDataDescription:
      'Data will appear once records are available.',
  },


  rotation: {

    title:
      'Injection Rotation',

    currentSite:
      'Current Site',

    suggestedSite:
      'Next Suggested Site',

    abdomen:
      'Abdomen',

    rightUpper:
      'Right Upper',

    leftUpper:
      'Left Upper',

    rightLower:
      'Right Lower',

    leftLower:
      'Left Lower',

    next:
      'Next',

    history:
      'Rotation History',

    noLog:
      'Never injected',
  },


  settings: {

    title:
      'BioStack Settings',

    subtitle:
      'Backup, privacy, and local data control.',

    language:
      'Language',

    languageDescription:
      'Choose your application language',

    indonesian:
      'Bahasa Indonesia',

    english:
      'English',

    notifications:
      'Notifications',

    exportAllData:
      'Export all data',

    exportAllDataDesc:
      'Creates a single JSON file containing inventory, freezer, history, rotation, and tracker settings.',

    exportBackup:
      'Export Backup',

    restoreFromBackup:
      'Restore from backup',

    restoreFromBackupDesc:
      'Select a BioStack JSON file to replace local data with your saved checkpoint.',

    pickFile:
      'Choose File',

    restoreWarning:
      'Restoring will replace current local data. Export a recent backup before proceeding.',

    notificationHint:
      'BioStack uses local notifications. No server or push notifications needed; reminders are generated from schedules stored on your device.',

    appearance:
      'Appearance',

    data:
      'Data',

    about:
      'About',

    version:
      'Version',

    languageChanged:
      'Application language updated.',
  },


  alerts: {

    warning:
      'Warning',

    success:
      'Success',

    error:
      'Error',

    invalidCalculation:
      'Invalid Calculation',

    insufficientLiquid:
      'Insufficient Liquid',

    failedToRecord:
      'Failed to Record',

    pleaseCheckData:
      'Please check the entered data.',

    tryAgain:
      'Please try again.',

    delete:
      'Delete',

    deleteConfirmation:
      'Are you sure you want to delete this item?',
  },


  frequency: {

    daily:
      'Daily',

    twiceWeekly:
      'Twice Weekly',

    threeTimesWeekly:
      'Three Times Weekly',

    weekly:
      'Weekly',

    everyDay:
      'Every Day',

    mondayThursday:
      'Mon, Thu',

    mondayWednesdayFriday:
      'Mon, Wed, Fri',

    monday:
      'Mon',
  },


  status: {

    active:
      'Active',

    inactive:
      'Inactive',

    empty:
      'Empty',

    paused:
      'Paused',

    completed:
      'Completed',

    pending:
      'Pending',

    missed:
      'Missed',
  },


  // ----------------------------------------------------------
  // CALCULATOR
  // ----------------------------------------------------------

  calculator: {
    title: 'Precision Dosing Calculator',
    subtitle: 'Generic simulation of peptide dose, BAC water, and U-100 syringe',
    vialSizeLabel: 'Vial Size',
    bacWaterLabel: 'Solvent Volume (BAC Water)',
    targetDoseLabel: 'Target Dose',
    resultTitle: 'Precision Calculation Result',
    volumeToInject: 'Volume to Inject',
    volumeSub: 'Liquid volume to draw',
    syringeMarking: 'U-100 Syringe Marking',
    syringeSub: 'Insulin syringe unit mark',
    syringeVisualizerLabel: 'U-100 Syringe Visualizer',
    concentration: 'Solution Concentration',
    totalDosesInVial: 'Total Doses per Vial',
    dosesUnit: 'doses',
    summaryFormula: 'Vial {{vial}} dissolved with {{bac}} → Dose {{dose}} requires {{vol}} ({{iu}})',
    resetValues: 'Reset to Default',
  },


  // ----------------------------------------------------------
  // ROTATION SITES
  // ----------------------------------------------------------

  rotationSites: {
    KA: 'Right Upper',
    KiA: 'Left Upper',
    KB: 'Right Lower',
    KiB: 'Left Lower',
    PKi: 'Left Thigh',
    PKn: 'Right Thigh',
    LKi: 'Left Arm',
    LKn: 'Right Arm',
    BKi: 'Left Glute',
    BKn: 'Right Glute',
    abdomen: 'Abdomen',
    thigh: 'Anterior Thigh',
    arm: 'Outer Tricep',
    glute: 'Upper Outer Glute',
  },


  // ----------------------------------------------------------
  // TODAY
  // ----------------------------------------------------------

  today: {
    title: "Today's Schedule",
    subtitle: 'Track and record your daily peptide injections',
    noSchedule: 'No Scheduled Injections Today',
    noScheduleSub: 'All scheduled injections are completed or today is a Rest Day.',
    goToInventory: 'Open Fridge Inventory',
    quickLog: 'Quick Log',
    quickLogModal: 'QUICK LOG',
    quickLogSubtitle: 'Quickly record an injection and update vial liquid',
    selectSite: 'Select Injection Site',
    currentRotation: 'Recommended Rotation',
    optionalNote: 'Optional Note (e.g., reaction, sleep timing)',
    confirmLog: 'Confirm Injection',
    completedToday: 'Completed Today',
    missedSchedule: 'Missed Schedule',
    dueSchedule: "Today's Schedule",
    injectNow: 'Inject Now',
    restDay: 'Rest Day',
    scheduledTime: 'Scheduled Time',
    dosesLeft: 'Doses Left',
    daysLeft: 'Days Left',
    successRecord: 'Injection Recorded',
    liquidUpdated: 'Vial remaining liquid automatically updated.',
  },


  // ----------------------------------------------------------
  // CHAT ASSISTANT
  // ----------------------------------------------------------

  chat: {
    title: 'BioStack AI Assistant',
    subtitle: 'Smart peptide calculation & local protocol assistant',
    offlineMode: 'Offline Mode (Local)',
    onlineMode: 'Online Mode (Gemini AI)',
    inputPlaceholder: 'Ask about dosing, calculation, syringe...',
    welcomeMessage: 'Hello! I am your BioStack assistant. Ask about syringe markings, mg to mcg conversions, or injection rotation guidelines.',
    disclaimer: 'Note: These calculation metrics are for personal logging and not formal medical advice.',
  },

} as const;


// ============================================================
// LANGUAGE MAP
// ============================================================

export const TRANSLATIONS = {
  id: ID_TRANSLATIONS,
  en: EN_TRANSLATIONS,
} as const;


// ============================================================
// ACTIVE LANGUAGE HELPERS
// ============================================================

let currentLanguage: SupportedLanguage =
  DEFAULT_LANGUAGE;


// ============================================================
// SET LANGUAGE
// ============================================================

export function setLanguage(
  language: SupportedLanguage,
): void {
  currentLanguage = language;
}


// ============================================================
// GET LANGUAGE
// ============================================================

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}


// ============================================================
// GET TRANSLATION TREE
// ============================================================

function getNestedValue(
  tree: TranslationTree,
  path: string,
): string | TranslationTree | undefined {

  const segments = path.split('.');

  let current:
    | TranslationValue
    | undefined = tree;

  for (const segment of segments) {

    if (
      typeof current !== 'object' ||
      current === null
    ) {
      return undefined;
    }

    current =
      current[segment];
  }

  if (typeof current === 'string') {
    return current;
  }

  return current as TranslationTree | undefined;
}


// ============================================================
// VARIABLE INTERPOLATION
// ============================================================

export function interpolate(
  template: string,
  variables?: Record<
    string,
    string | number
  >,
): string {

  if (!variables) {
    return template;
  }

  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => {

      const value =
        variables[key];

      return value === undefined
        ? `{{${key}}}`
        : String(value);
    },
  );
}


// ============================================================
// TRANSLATE
// ============================================================
//
// Example:
//
// t('freezer.addPeptide')
//
// t('freezer.stockSummary', {
//   compounds: 6,
//   vials: 57,
// })
//
// ============================================================

export function t(
  key: string,
  variables?: Record<
    string,
    string | number
  >,
): string {

  const activeTree = TRANSLATIONS[currentLanguage] as unknown as TranslationTree;

  const fallbackTree = TRANSLATIONS[DEFAULT_LANGUAGE] as unknown as TranslationTree;

  const activeValue =
    getNestedValue(
      activeTree,
      key,
    );

  const fallbackValue =
    getNestedValue(
      fallbackTree,
      key,
    );

  const value =
    typeof activeValue === 'string'
      ? activeValue
      : typeof fallbackValue === 'string'
      ? fallbackValue
      : key;

  return interpolate(
    value,
    variables,
  );
}


// ============================================================
// LANGUAGE OPTIONS
// ============================================================

export const LANGUAGE_OPTIONS = [
  {
    code: 'en' as const,
    label: 'English',
    shortLabel: 'EN',
  },
  {
    code: 'id' as const,
    label: 'Bahasa Indonesia',
    shortLabel: 'ID',
  },
];


// ============================================================
// TYPE HELPERS
// ============================================================

export type TranslationKeys =
  keyof typeof ID_TRANSLATIONS;


// ============================================================
// OPTIONAL REACT-FRIENDLY SNAPSHOT
// ============================================================
//
// Screen yang sudah memakai React dapat:
//
//   const language = getLanguage();
//
// lalu menggunakan:
//
//   t('freezer.addPeptide')
//
// Untuk perubahan bahasa real-time, nantinya kita tinggal
// hubungkan currentLanguage ke app/settings state.
// ============================================================

export const i18n = {
  t,
  setLanguage,
  getLanguage,
  languages: LANGUAGE_OPTIONS,
};
