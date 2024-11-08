import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import theme from './src/syntaxtheme.json';
import robotsTxt from 'astro-robots-txt';
import tailwindcssNesting from 'tailwindcss/nesting';
import { transformerCopyButton } from '@rehype-pretty/transformers';
import rehypePrettyCode from 'rehype-pretty-code';
import dotenv from 'dotenv';

const prettyCodeOptions = {
  theme,
  onVisitHighlightedLine(node) {
    node?.properties?.className
      ? node.properties.className.push("highlighted")
      : (node.properties.className = ["highlighted"]);
  },
  onVisitHighlightedChars(node) {
    console.log(node);
    node?.properties?.className
      ? node.properties.className.push("highlighted-chars")
      : (node.properties.className = ["highlighted-chars"]);
  },
  filterMetaString: (string) => string,
  showLanguage: true,
  transformers: [transformerCopyButton({ feedbackDuration: 2_000, visibility: 'hover' })],
  tokensMap: {},
};

dotenv.config();
// https://astro.build/config
export default defineConfig({
  image: {
    domains: ['simongreer.co.uk'],
  },
  env: {
    schema: {
      SITE_URL: envField.string({ context: "client", access: "public", optional: true}),
    }
  },
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcssNesting]
      }
    }
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    robotsTxt(),
    mdx(),
    react(),
    preact()],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    shikiConfig: { theme },
    },
  site: 'https://simongreer.co.uk'
})