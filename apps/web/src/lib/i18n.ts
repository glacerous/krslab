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

    // Step-by-Step Onboarding Flow
    onboardingStep: string;
    onboardingOf: string;
    skipSetup: string;
    continueBtn: string;
    backBtn: string;
    liveDeskPreviewNote: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    step1Eyebrow: string;
    step1Headline: string;
    step1Sub: string;
    warmPaperTitle: string;
    warmPaperSub: string;
    darkInkTitle: string;
    darkInkSub: string;
    switchesInstantlyNote: string;
    step2Eyebrow: string;
    step2Headline: string;
    step2Sub: string;
    loadBalancedTitle: string;
    loadBalancedSub: string;
    loadFullTitle: string;
    loadFullSub: string;
    loadUnlimitedTitle: string;
    loadUnlimitedSub: string;
    recommendedBadge: string;
    step3Eyebrow: string;
    step3Headline: string;
    step3Sub: string;
    pasteBimaTitle: string;
    pasteBimaSub: string;
    exploreSampleTitle: string;
    exploreSampleSub: string;
    tryIn1ClickBadge: string;
    syncTitle: string;
    syncSub: string;
    signInBtn: string;
    syncComingSoonBadge: string;
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

        // Step-by-Step Onboarding Flow
        onboardingStep: "step",
        onboardingOf: "of",
        skipSetup: "Skip setup →",
        continueBtn: "Continue →",
        backBtn: "← Back",
        liveDeskPreviewNote: "live desk preview",
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        step1Eyebrow: "01 · language & canvas",
        step1Headline: "Tune your workspace before we start.",
        step1Sub: "Pick the canvas feel that's easiest on your eyes.",
        warmPaperTitle: "Warm Paper",
        warmPaperSub: "Crisp daylight architect sheet",
        darkInkTitle: "Dark Ink",
        darkInkSub: "Low-glare night studio",
        switchesInstantlyNote: "switches every label in the studio instantly",
        step2Eyebrow: "02 · semester workload",
        step2Headline: "Pick your SKS safety cap.",
        step2Sub: "We'll track your credit count as you pick courses and warn you if you go over.",
        loadBalancedTitle: "20 SKS · Balanced Load",
        loadBalancedSub: "Ideal for lighter semesters or taking 6–7 focused courses.",
        loadFullTitle: "24 SKS · Full Semester Cap",
        loadFullSub: "Standard maximum university credit load.",
        loadUnlimitedTitle: "Unlimited · Free Exploration",
        loadUnlimitedSub: "No credit cap — great for comparing extra electives freely.",
        recommendedBadge: "recommended",
        step3Eyebrow: "03 · load your courses",
        step3Headline: "Start with your campus schedule or test the studio.",
        step3Sub: "Choose how you'd like to load your courses into the planner.",
        pasteBimaTitle: "Paste my BIMA / SIAKAD schedule",
        pasteBimaSub: "Copy your Jadwal Dosen table and paste it in — rooms, times, and lecturers parse automatically.",
        exploreSampleTitle: "Explore with sample courses",
        exploreSampleSub: "Jump straight into a pre-loaded Informatics schedule to test dragging, locking, and auto-scheduling.",
        tryIn1ClickBadge: "try it in 1 click",
        syncTitle: "Sync across devices",
        syncSub: "Sign in to back up your plans and sources to the cloud",
        signInBtn: "Sign in",
        syncComingSoonBadge: "coming soon · saved locally for now"
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

        // Step-by-Step Onboarding Flow
        onboardingStep: "langkah",
        onboardingOf: "dari",
        skipSetup: "Lewati penyiapan →",
        continueBtn: "Lanjut →",
        backBtn: "← Kembali",
        liveDeskPreviewNote: "pratinjau mejamu",
        mon: "Sen",
        tue: "Sel",
        wed: "Rab",
        thu: "Kam",
        fri: "Jum",
        step1Eyebrow: "01 · bahasa & kanvas",
        step1Headline: "Atur ruang kerjamu sebelum kita mulai.",
        step1Sub: "Pilih tema kanvas yang paling nyaman untuk matamu.",
        warmPaperTitle: "Warm Paper",
        warmPaperSub: "Lembar arsitek terang di siang hari",
        darkInkTitle: "Dark Ink",
        darkInkSub: "Studio malam minim silau",
        switchesInstantlyNote: "mengubah semua label studio seketika",
        step2Eyebrow: "02 · beban semester",
        step2Headline: "Pilih batas aman SKS semestermu.",
        step2Sub: "Kami akan memantau jumlah SKS saat memilih matkul dan mengingatkan jika berlebih.",
        loadBalancedTitle: "20 SKS · Beban Seimbang",
        loadBalancedSub: "Ideal untuk semester santai atau mengambil 6–7 matkul fokus.",
        loadFullTitle: "24 SKS · Batas Penuh Kampus",
        loadFullSub: "Beban kredit maksimal standar universitas.",
        loadUnlimitedTitle: "Tanpa Batas · Eksplorasi Bebas",
        loadUnlimitedSub: "Tanpa batas kredit — leluasa membandingkan banyak matkul pilihan.",
        recommendedBadge: "disarankan",
        step3Eyebrow: "03 · muat mata kuliah",
        step3Headline: "Mulai dengan jadwal kampusmu atau uji coba studio.",
        step3Sub: "Pilih cara memulai penyusunan rencana jadwalmu.",
        pasteBimaTitle: "Tempel jadwal BIMA / SIAKAD saya",
        pasteBimaSub: "Salin tabel Jadwal Dosen dan tempel — ruang, jam, dan dosen terurai otomatis.",
        exploreSampleTitle: "Coba dengan matkul contoh",
        exploreSampleSub: "Langsung masuk ke jadwal Informatika yang sudah terisi untuk mencoba geser, kunci, dan susun otomatis.",
        tryIn1ClickBadge: "coba 1 klik",
        syncTitle: "Sinkronisasi antar perangkat",
        syncSub: "Masuk untuk mencadangkan rencana dan sumber ke cloud",
        signInBtn: "Masuk akun",
        syncComingSoonBadge: "segera hadir · saat ini tersimpan lokal"
    }
};

export function getTranslation(lang: Language = "en"): Translations {
    return translations[lang] || translations.en;
}
