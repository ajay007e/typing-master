export type Stage = "config" | "prestart" | "running" | "finished";

export interface CourseLesson {
    id: string;
    category: string;
    title: string;
    desc: string;
    texts: string[];
}

export interface InscriptEntry {
    key: string;
    shift: boolean;
}

export interface ProgressMode {
    runs: number;
    bestWpm: number;
    bestAcc: number;
}

export interface ProgressLesson extends ProgressMode {
    lastTime: string | null;
}

export interface AppConfig {
    mode: "letters" | "paragraph" | "common" | "course";
    letters: {
        selectedLetters: string[] | null;
        lenOption: "50" | "100" | "200" | "custom";
        customLength: number | string;
    };
    paragraph: {
        text: string;
    };
    common: {
        lenOption: "30" | "60" | "120" | "custom";
        customLength: number | string;
    };
    course: {
        lessonId: string | null;
    };
    ui: {
        allowBackspace: boolean;
        showKeyboard: boolean;
        fontFamily: string;
        fontSize: string;
    };
}

export interface AppProgress {
    modes: Record<string, ProgressMode>;
    lessons: Record<string, ProgressLesson>;
}

export interface AppState {
    config: AppConfig;
    progress: AppProgress;
}
