// src/utils/sounds.ts
import DEFAULT_SOUND_SETTINGS from "./settings";

type Settings = typeof DEFAULT_SOUND_SETTINGS;

let settings: Settings = DEFAULT_SOUND_SETTINGS;

/** Allow runtime override of sound settings (optional) */
export function configureSounds(newSettings: Partial<Settings>) {
    settings = { ...settings, ...newSettings };
    // re-init pools if necessary (we keep it simple; apps can reload)
}

/** A small player using an Audio pool to support overlapping keystroke sounds. */
class SoundPlayer {
    private typingPool: HTMLAudioElement[] = [];
    private typingIdx = 0;
    private errorAudio: HTMLAudioElement | null = null;
    private initialized = false;

    init() {
        if (this.initialized) return;
        this.initialized = true;

        const tSrc = settings.typingSrc;
        const poolSize = Math.max(1, settings.typingPoolSize || 4);
        for (let i = 0; i < poolSize; i++) {
            const a = new Audio(tSrc);
            a.preload = "auto";
            a.volume = settings.typingVolume;
            // small hack to allow user gesture autoplay in many browsers; we still catch()
            this.typingPool.push(a);
        }

        const e = new Audio(settings.errorSrc);
        e.preload = "auto";
        e.volume = settings.errorVolume;
        this.errorAudio = e;
    }

    playTyping() {
        if (!settings.enableSounds) return;
        this.init();
        if (!this.typingPool.length) return;
        const a = this.typingPool[this.typingIdx % this.typingPool.length];
        this.typingIdx++;
        try {
            a.currentTime = 0;
            // some browsers prevent immediate play until a user gesture; ignore errors
            a.play().catch(() => { });
        } catch {
            // ignore
        }
    }

    playError() {
        if (!settings.enableSounds) return;
        this.init();
        if (!this.errorAudio) return;
        try {
            this.errorAudio.currentTime = 0;
            this.errorAudio.play().catch(() => { });
        } catch {
            // ignore
        }
    }
}

const player = new SoundPlayer();

export const playTypingSound = () => player.playTyping();
export const playErrorSound = () => player.playError();
export const setSoundConfig = configureSounds;
