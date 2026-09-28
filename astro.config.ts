import { defineConfig, envField, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import astroExpressiveCode from 'astro-expressive-code';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://simongreer.co.uk',
  output: 'static',
  session: false,
  prefetch: false,
  adapter: cloudflare({
    imageService: { build: 'compile', runtime: 'cloudflare-binding' },
  }),
  integrations: [
    astroExpressiveCode({ themes: ['github-dark', 'github-light'] }),
    mdx(),
    sitemap(),
    icon({
      include: {
        'material-symbols': ['newspaper-outline', 'work-outline', 'account-circle-outline', 'menu-rounded', 'close-rounded', 'light-mode-outline', 'dark-mode-outline', 'chevron-right-rounded'],
        'simple-icons': ['github', 'bluesky', 'astro', 'cloudflare', 'bun', 'typescript'],
      },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist Sans',
      cssVariable: '--font-sans',
      options: { variants: [{ weight: '100 900', style: 'normal', src: ['./src/assets/fonts/Geist[wght].woff2'] }] },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      options: { variants: [{ weight: '100 900', style: 'normal', src: ['./src/assets/fonts/GeistMono[wght].woff2'] }] },
    },
  ],
  env: {
    schema: {
      SITE_URL: envField.string({ context: 'client', access: 'public', default: 'https://simongreer.co.uk' }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
    },
  },
  build: { assets: '_astro' },
});
