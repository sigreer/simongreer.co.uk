import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import robotsTxt from 'astro-robots-txt';
import tailwindcssNesting from 'tailwindcss/nesting';
import { bundledLanguages, bundledThemes } from 'shiki';
import { transformerNotationFocus } from '@shikijs/transformers';
import { addCopyButton } from 'shiki-transformer-copy-button';
import rehypePrettyCode from 'rehype-pretty-code';
import dotenv from 'dotenv';
const options = {
  toggle: 2000,
}

dotenv.config();
// https://astro.build/config
export default defineConfig({
  image: {
    domains: [process.env.DIRECTUS_URL],
  },
  env: {
    schema: {
      DIRECTUS_URL: envField.string({ context: "client", access: "public", optional: true}),
      SITE_URL: envField.string({ context: "client", access: "public", optional: true}),
      DIRECTUS_API_TOKEN: envField.string({ context: "server", access: "secret", optional: true})
    }
  },
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcssNesting]
      }
    }
  },
  integrations: [tailwind({ applyBaseStyles: false }), robotsTxt(), mdx(), react(),preact()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
      langs: ['javascript', 'typescript', 'python', 'json', 'css', 'scss', 'bash', 'yaml', 'markdown', 'html', 'astro', 'nginx', 'sql', 'ts', 'jsx', 'mdx'],
      transformers: [addCopyButton(options), transformerNotationFocus()],
      plugins: [rehypePrettyCode, {
        theme: 'github-dark',
        keepBackground: false, 
        showLineNumbers: true,
      }]
    }
  },
  site: process.DIRECTUS_URL
})