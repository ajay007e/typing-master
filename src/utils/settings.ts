// src/utils/settings.ts
import typingSound from "../assets/sounds/typing.wav";
import errorSound from "../assets/sounds/error.wav";

const DEFAULT_SOUND_SETTINGS = {
    enableSounds: true,

    // use the imported file URLs
    typingSrc: typingSound,
    errorSrc: errorSound,

    // volume 0.0 - 1.0
    typingVolume: 0.16,
    errorVolume: 0.7,

    // typing sound pool size
    typingPoolSize: 6,
};

export type SoundSettings = typeof DEFAULT_SOUND_SETTINGS;

export default DEFAULT_SOUND_SETTINGS;
