export type Language = "en" | "id";

export interface Translations {
    // Top bar & Header
    scheduleSources: string;
    schedulePlans: string;
    rules: string;
    autoSchedule: string;
    shuffle: string;
    solving: string;
    spaceToShuffle: string;
    tutorial: string;
    export: string;
    exportPng: string;
    exportSuccess: string;
    exportFailed: string;
    preferences: string;
    sksLimit: string;
    overload: string;
    exceeded: string;
    
    // Preferences popover
    localWorkspace: string;
    savedOnDevice: string;
    signInToSync: string;
    comingSoonBadge: string;
    languageLabel: string;
    appearanceLabel: string;
    themeWarmPaper: string;
    themeDarkInk: string;
    sksCapLabel: string;
    unlimited: string;
    openWelcome: string;
    startTutorial: string;

    // Sidebar
    selectedCourses: string;
    addCourses: string;
    viewSelected: string;
    addCourseBtn: string;
    coursesAvailable: string;
    noCoursesYet: string;
    browseCatalog: string;
    searchPlaceholder: string;
    clickToSwap: string;
    noClass: string;
    noScheduleSet: string;
    classLocked: string;
    classUnlocked: string;
    removedCourse: string;
    addedCourse: string;
    dragIntroPre: string;
    dragIntroHighlight: string;
    dragIntroPost: string;

    // Plan switcher
    duplicateCurrentPlan: string;
    createNewPlan: string;
    deletePlanConfirm: string;
    cancel: string;
    save: string;
    rename: string;
    deletePlanTitle: string;
    plansCount: string;

    // Sources switcher
    importNewBima: string;
    loadSample: string;
    coursesAndClasses: string;

    // Preview bar
    previewingSchedule: string;
    accept: string;
    
    // Welcome screen
    welcomeHeadline: string;
    welcomeSub: string;
    localNote: string;
    rowLanguage: string;
    rowAppearance: string;
    rowSksLimit: string;
    rowCloudSync: string;
    cloudSyncNote: string;
    importTableBtn: string;
    exploreSampleBtn: string;
    tryStudioNote: string;

    // Step-by-Step Onboarding Flow (warm nexvyn editorial style)
    onboardingStep: string;
    skipSetup: string;
    continueBtn: string;
    backBtn: string;
    greetingDoodle: string;
    step1Headline: string;
    step1IntroPre: string;
    step1IntroHighlight: string;
    step1IntroPost: string;
    languageLabelDoodle: string;
    appearanceLabelDoodle: string;
    switchesLiveLine1: string;
    switchesLiveLine2: string;
    step2Doodle: string;
    step2Headline: string;
    step2Desc: string;
    step2Cap20: string;
    step2Cap24: string;
    step2CapUnlimited: string;
    selectedDoodle: string;
    defaultDoodle: string;
    recommendedDoodle: string;
    step3Doodle: string;
    step3Headline: string;
    step3Subtitle: string;
    step3Header: string;
    step3ImportTitle: string;
    step3ImportDesc: string;
    step3SampleTitle: string;
    step3SampleDoodle: string;
    step3SampleDesc: string;
    cloudSyncPre: string;
    cloudSyncHighlight: string;
    cloudSyncPost: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        // Top bar & Header
        scheduleSources: "schedule sources",
        schedulePlans: "schedule plans",
        rules: "Rules",
        autoSchedule: "Auto-Schedule",
        shuffle: "Shuffle",
        solving: "Solving...",
        spaceToShuffle: "← space to shuffle",
        tutorial: "tutorial",
        export: "Export",
        exportPng: "Rendering PNG Schedule...",
        exportSuccess: "Schedule Exported as PNG!",
        exportFailed: "Failed to export image",
        preferences: "Preferences",
        sksLimit: "sks",
        overload: "Overload",
        exceeded: "Exceeded",
        
        // Preferences popover
        localWorkspace: "Local Workspace",
        savedOnDevice: "Saved on this device",
        signInToSync: "Sign in to sync across devices",
        comingSoonBadge: "soon",
        languageLabel: "Language",
        appearanceLabel: "Appearance",
        themeWarmPaper: "Light",
        themeDarkInk: "Dark",
        sksCapLabel: "SKS Cap",
        unlimited: "∞",
        openWelcome: "Open welcome screen",
        startTutorial: "Start tutorial",

        // Sidebar
        selectedCourses: "selected courses",
        addCourses: "add courses",
        viewSelected: "← view selected",
        addCourseBtn: "+ add course",
        coursesAvailable: "courses available",
        noCoursesYet: "No courses added yet.",
        browseCatalog: "Browse course catalog",
        searchPlaceholder: "Search course title or code...",
        clickToSwap: "click to swap class ↓",
        noClass: "No Class",
        noScheduleSet: "No schedule set",
        classLocked: "Class locked",
        classUnlocked: "Class unlocked",
        removedCourse: "Removed",
        addedCourse: "Added",
        dragIntroPre: "Drag any class on the canvas or click to explore ",
        dragIntroHighlight: "conflict-free",
        dragIntroPost: " alternatives.",

        // Plan switcher
        duplicateCurrentPlan: "Duplicate current plan",
        createNewPlan: "+ Create new plan",
        deletePlanConfirm: "Delete",
        cancel: "Cancel",
        save: "Save",
        rename: "Rename plan",
        deletePlanTitle: "Delete plan",
        plansCount: "plans",

        // Sources switcher
        importNewBima: "+ Import new BIMA source...",
        loadSample: "Load sample Informatics data",
        coursesAndClasses: "courses · classes",

        // Preview bar
        previewingSchedule: "previewing schedule",
        accept: "Accept",
        
        // Welcome screen
        welcomeHeadline: "Plan your semester schedule without the spreadsheet headache.",
        welcomeSub: "Paste your course table, drag classes on the canvas, and explore conflict-free combinations. Before we jump in, tune your desk:",
        localNote: "100% local in your browser",
        rowLanguage: "language",
        rowAppearance: "appearance",
        rowSksLimit: "sks limit",
        rowCloudSync: "cloud sync",
        cloudSyncNote: "← coming soon · using local storage for now",
        importTableBtn: "Import schedule table →",
        exploreSampleBtn: "Explore with sample courses",
        tryStudioNote: "← try the studio first",

        // Step-by-Step Onboarding Flow (warm nexvyn editorial style)
        onboardingStep: "step",
        skipSetup: "Skip →",
        continueBtn: "Continue →",
        backBtn: "← Back",
        greetingDoodle: "👋 hey there, welcome!",
        step1Headline: "Let's set up your semester desk.",
        step1IntroPre: "I built this workspace to take the headache out of planning your semester KRS. Paste your raw course table, drag classes on the grid, and find every ",
        step1IntroHighlight: "conflict-free",
        step1IntroPost: " combination.",
        languageLabelDoodle: "language / bahasa",
        appearanceLabelDoodle: "canvas theme / tampilan kanvas",
        switchesLiveLine1: "updates live",
        switchesLiveLine2: "as you click",
        step2Doodle: "semester workload",
        step2Headline: "How many SKS are you planning?",
        step2Desc: "Pick a credit cap so the studio can track your load as you add courses.",
        step2Cap20: "balanced load, 6–7 courses",
        step2Cap24: "standard maximum semester load",
        step2CapUnlimited: "free exploration with no cap",
        selectedDoodle: "selected ✓",
        defaultDoodle: "default",
        recommendedDoodle: "recommended ✓",
        step3Doodle: "all set, let's go!",
        step3Headline: "How would you like to start?",
        step3Subtitle: "Choose how you'd like to load your courses into the planner.",
        step3Header: "start scheduling",
        step3ImportTitle: "Import BIMA / SIAKAD table",
        step3ImportDesc: "Copy rows from Jadwal Dosen and paste them straight in.",
        step3SampleTitle: "Explore with sample courses",
        step3SampleDoodle: "← psst, try this first",
        step3SampleDesc: "Jump straight into a pre-loaded Informatics schedule.",
        cloudSyncPre: "Cloud sync across devices is ",
        cloudSyncHighlight: "coming soon",
        cloudSyncPost: " — your plans save automatically in this browser."
    },
    id: {
        // Top bar & Header
        scheduleSources: "sumber jadwal",
        schedulePlans: "rencana jadwal",
        rules: "Aturan",
        autoSchedule: "Susun Otomatis",
        shuffle: "Acak Lagi",
        solving: "Menyusun...",
        spaceToShuffle: "← spasi untuk acak",
        tutorial: "panduan",
        export: "Ekspor",
        exportPng: "Menyiapkan PNG Jadwal...",
        exportSuccess: "Jadwal Berhasil Diekspor sebagai PNG!",
        exportFailed: "Gagal mengekspor gambar",
        preferences: "Pengaturan",
        sksLimit: "sks",
        overload: "Lebih",
        exceeded: "Melampaui",
        
        // Preferences popover
        localWorkspace: "Ruang Kerja Lokal",
        savedOnDevice: "Tersimpan di perangkat ini",
        signInToSync: "Masuk untuk sinkronisasi antar perangkat",
        comingSoonBadge: "segera",
        languageLabel: "Bahasa",
        appearanceLabel: "Tampilan",
        themeWarmPaper: "Terang",
        themeDarkInk: "Gelap",
        sksCapLabel: "Batas SKS",
        unlimited: "∞",
        openWelcome: "Buka layar sambutan",
        startTutorial: "Mulai panduan",

        // Sidebar
        selectedCourses: "matkul terpilih",
        addCourses: "tambah matkul",
        viewSelected: "← lihat terpilih",
        addCourseBtn: "+ tambah matkul",
        coursesAvailable: "matkul tersedia",
        noCoursesYet: "Belum ada matkul yang dipilih.",
        browseCatalog: "Jelajahi katalog matkul",
        searchPlaceholder: "Cari nama atau kode matkul...",
        clickToSwap: "klik untuk ganti kelas ↓",
        noClass: "Tanpa Kelas",
        noScheduleSet: "Jadwal belum disetel",
        classLocked: "Kelas dikunci",
        classUnlocked: "Kelas dibuka",
        removedCourse: "Dihapus",
        addedCourse: "Ditambahkan",
        dragIntroPre: "Geser kelas di kanvas atau klik untuk mencari alternatif ",
        dragIntroHighlight: "bebas bentrok",
        dragIntroPost: ".",

        // Plan switcher
        duplicateCurrentPlan: "Duplikat rencana ini",
        createNewPlan: "+ Buat rencana baru",
        deletePlanConfirm: "Hapus",
        cancel: "Batal",
        save: "Simpan",
        rename: "Ganti nama",
        deletePlanTitle: "Hapus rencana",
        plansCount: "rencana",

        // Sources switcher
        importNewBima: "+ Impor sumber BIMA baru...",
        loadSample: "Muat data contoh Informatika",
        coursesAndClasses: "matkul · kelas",

        // Preview bar
        previewingSchedule: "pratinjau jadwal",
        accept: "Terapkan",
        
        // Welcome screen
        welcomeHeadline: "Susun jadwal kuliah semestermu tanpa pusing bentrok.",
        welcomeSub: "Tempel tabel jadwal kampusmu, geser kelas di kanvas, dan temukan kombinasi bebas bentrok. Sebelum mulai, atur mejamu:",
        localNote: "100% lokal di browser Anda",
        rowLanguage: "bahasa",
        rowAppearance: "tampilan",
        rowSksLimit: "batas sks",
        rowCloudSync: "sinkronisasi",
        cloudSyncNote: "← segera hadir · saat ini tersimpan lokal",
        importTableBtn: "Impor tabel jadwal →",
        exploreSampleBtn: "Coba dengan matkul contoh",
        tryStudioNote: "← coba studio langsung",

        // Step-by-Step Onboarding Flow (warm nexvyn editorial style)
        onboardingStep: "langkah",
        skipSetup: "Lewati →",
        continueBtn: "Lanjut →",
        backBtn: "← Kembali",
        greetingDoodle: "👋 halo, selamat datang!",
        step1Headline: "Mari siapkan meja jadwal semestermu.",
        step1IntroPre: "Ruang kerja ini dibuat agar menyusun KRS tidak lagi memusingkan. Tempel tabel jadwal dari portal kampus, geser kelas di kanvas, dan temukan kombinasi ",
        step1IntroHighlight: "bebas bentrok",
        step1IntroPost: ".",
        languageLabelDoodle: "language / bahasa",
        appearanceLabelDoodle: "canvas theme / tampilan kanvas",
        switchesLiveLine1: "berubah langsung",
        switchesLiveLine2: "saat diklik",
        step2Doodle: "sks & beban kuliah",
        step2Headline: "Berapa target SKS semester ini?",
        step2Desc: "Pilih batas SKS agar studio dapat memantau beban kredit saat kamu memilih mata kuliah.",
        step2Cap20: "beban seimbang, 6–7 matkul",
        step2Cap24: "batas maksimum standar semester",
        step2CapUnlimited: "eksplorasi bebas tanpa batas",
        selectedDoodle: "terpilih ✓",
        defaultDoodle: "standar",
        recommendedDoodle: "disarankan ✓",
        step3Doodle: "siap mulai!",
        step3Headline: "Bagaimana kamu ingin memulai?",
        step3Subtitle: "Pilih cara memulai penyusunan rencana jadwalmu.",
        step3Header: "mulai menyusun",
        step3ImportTitle: "Impor tabel BIMA / SIAKAD",
        step3ImportDesc: "Salin baris dari Jadwal Dosen dan tempel langsung.",
        step3SampleTitle: "Coba dengan matkul contoh",
        step3SampleDoodle: "← coba ini dulu",
        step3SampleDesc: "Langsung masuk ke jadwal Informatika yang sudah terisi.",
        cloudSyncPre: "Sinkronisasi cloud antar perangkat akan ",
        cloudSyncHighlight: "segera hadir",
        cloudSyncPost: " — rencana jadwalmu tersimpan otomatis di browser ini."
    }
};

export function getTranslation(lang: Language = "en"): Translations {
    return translations[lang] || translations.en;
}
