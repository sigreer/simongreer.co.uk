/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
    interface Window {
        applyTagColorsToNewElements: () => void;
    }
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

export {};