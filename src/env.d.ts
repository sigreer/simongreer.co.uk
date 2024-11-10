/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
    interface Window {
        applyTagColorsToNewElements: () => void;
    }
}

interface ImportMetaEnv {
    // Add any env variables here if needed
}

export {};