import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import robotsTxt from 'astro-robots-txt';
import tailwindcssNesting from 'tailwindcss/nesting';
import dotenv from 'dotenv';

dotenv.config();

// https://astro.build/config
export default defineConfig({
  image: {
    domains: [process.env.DIRECTUS_URL],
  },
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcssNesting]
      }
    }
  },
  integrations: [tailwind({ applyBaseStyles: false }), react(), robotsTxt()],
  site: process.env.SITE_URL
})