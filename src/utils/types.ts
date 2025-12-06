// src/utils/types.ts

export type Stage = "config" | "prestart" | "running" | "finished";

/**
 * Pass criteria shape used in course.json
 */
export interface PassCriteria {
    accuracy_percentage?: number;
    wpm?: number;
    min_score?: number;
    type: "completed" | "performance";
    [key: string]: any;
}

/**
 * Course lesson shape (matches your course.json)
 */
export interface CourseLesson {
    id: string;
    title: string;
    texts: string[];
    ui_mode?: "familiarization" | "practice" | string;
    category?: string;
    desc?: string;
    pass_criteria: PassCriteria;
    keys?: string[];
    [key: string]: any;
}

/**
 * Track per-lesson progress entry
 */
export interface LessonProgress {
    runs?: number;
    bestWpm?: number;
    bestAcc?: number;
    lastTime?: string | null;
}

/**
 * Expose the type used by UI components (alias)
 */
export type ProgressLesson = LessonProgress;

/**
 * Mode-level progress summary
 */
export interface ProgressMode {
    bestWpm?: number;
    bestAcc?: number;
    runs?: number;
}

/**
 * Application configuration shape (trimmed to fields used in the app)
 */
export interface AppConfig {
    mode: "letters" | "paragraph" | "common" | "course" | string;
    letters: {
        selectedLetters: string[] | null;
        lenOption: string;
        customLength: number;
    };
    paragraph: { text: string };
    common: { lenOption: string; customLength: number };
    course: { lessonId: string | null };
    ui: {
        showKeyboard: boolean;
        allowBackspace: boolean;
        fontFamily: string;
        fontSize: string;
    };
    sound: {
        enableSounds: boolean;
        typingVolumePct: number;
        errorVolumePct: number;
    };
}

/**
 * App progress structure
 */
export interface AppProgress {
    modes: Record<string, ProgressMode>;
    lessons: Record<string, LessonProgress>;
}

/**
 * Top-level app state
 */
export interface AppState {
    config: AppConfig;
    progress: AppProgress;
}
