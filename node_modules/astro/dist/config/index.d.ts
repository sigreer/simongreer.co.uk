import type { UserConfig as ViteUserConfig } from 'vite';
import type { AstroInlineConfig, AstroUserConfig } from '../types/public/config.js';
export declare function defineConfig(config: AstroUserConfig): AstroUserConfig;
export declare function getViteConfig(userViteConfig: ViteUserConfig, inlineAstroConfig?: AstroInlineConfig): ({ mode, command }: {
    mode: "dev";
    command: "serve" | "build";
}) => Promise<Record<string, any>>;
