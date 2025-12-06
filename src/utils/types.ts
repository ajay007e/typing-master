export type Stage = "config" | "prestart" | "running" | "finished";

/** Per-mode progress */
export type ProgressMode = {
    runs: number;
    bestWpm: number;
    bestAcc: number;
};

/** Per-lesson progress (export name used across components) */
export type LessonProgress = {
    runs: number;
    bestWpm: number;
    bestAcc: number;
    lastTime: string | null;
};
// alias to satisfy other imports that expect ProgressLesson
export type ProgressLesson = LessonProgress;

/** App-wide progress snapshot */
export type AppProgress = {
    modes: {
        [mode in AppConfig["mode"]]?: ProgressMode;
    };
    lessons: {
        [lessonId: string]: LessonProgress;
    };
};

/** UI related config */
export type UiConfig = {
    showKeyboard: boolean;
    allowBackspace: boolean;
    fontFamily?: string;
    fontSize?: string;
};

/** Letters mode configuration */
export type LettersConfig = {
    selectedLetters: string[] | null;
    lenOption: "50" | "100" | "200" | "custom";
    customLength: number;
};

/** Paragraph mode config */
export type ParagraphConfig = {
    text: string;
};

/** Common words config */
export type CommonConfig = {
    lenOption: "30" | "60" | "120" | "custom";
    customLength: number;
};

/** Course config */
export type CourseConfig = {
    lessonId: string | null;
};

/** App-wide configuration */
export type AppConfig = {
    mode: "letters" | "paragraph" | "common" | "course";
    letters: LettersConfig;
    paragraph: ParagraphConfig;
    common: CommonConfig;
    course: CourseConfig;
    ui: UiConfig;
};

/** A course lesson shape loaded from course.json */
export type CourseLesson = {
    id: string;
    title: string;
    texts: string[];
    // optional: graphemes / keys used in familiarize drills
    keys?: string[];
    // optional: per-lesson thresholds for advancement
    thresholds?: {
        advanceScore?: number;
        minAccuracy?: number;
        maxMissing?: number;
    };
    // optional UI fields used in some components
    category?: string;
    desc?: string;
};

/** Full application state saved to localStorage */
export type AppState = {
    config: AppConfig;
    progress: AppProgress;
};
