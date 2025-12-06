// src/features/typing/constants.ts
import lettersConfig from "../../config/letters.json";
import commonWordsConfig from "../../config/commonWords.json";
import courseLessonsConfig from "../../config/course.json";

import type { CourseLesson, AppConfig } from "../../utils/types";

export const LETTERS = (lettersConfig as { letters: string[] }).letters;
export const COMMON_WORDS = (commonWordsConfig as { words: string[] }).words;
export const COURSE_LESSONS = courseLessonsConfig as {
    lessons: CourseLesson[];
};

export const WPM_UNLOCK = 25;
export const ACC_UNLOCK = 90;

export function prettyModeName(mode: AppConfig["mode"]) {
    switch (mode) {
        case "letters":
            return "Letters";
        case "paragraph":
            return "Paragraph";
        case "common":
            return "Common words";
        case "course":
            return "Course";
        default:
            return mode;
    }
}

export const MODES_META: {
    id: AppConfig["mode"];
    label: string;
    description: string;
    icon: "keyboard" | "document" | "stats" | "graduation";
}[] = [
        {
            id: "letters",
            label: "Letters",
            description: "Practice individual letters and keystrokes.",
            icon: "keyboard",
        },
        {
            id: "paragraph",
            label: "Paragraph",
            description: "Type full paragraphs to build rhythm.",
            icon: "document",
        },
        {
            id: "common",
            label: "Common words",
            description: "Practice most frequent Malayalam words.",
            icon: "stats",
        },
        {
            id: "course",
            label: "Course",
            description: "Structured lessons with progression.",
            icon: "graduation",
        },
    ];
