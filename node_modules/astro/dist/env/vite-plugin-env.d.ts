import { type Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
interface AstroEnvPluginParams {
    settings: AstroSettings;
    mode: 'dev' | 'build' | string;
    sync: boolean;
}
export declare function astroEnv({ settings, mode, sync }: AstroEnvPluginParams): Plugin;
export {};
