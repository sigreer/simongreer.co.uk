import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import theme from './src/syntaxtheme.json';
import robotsTxt from 'astro-robots-txt';
import tailwindcssNesting from 'tailwindcss/nesting';
import { transformerCopyButton } from '@rehype-pretty/transformers';
import rehypePrettyCode from 'rehype-pretty-code';
import dotenv from 'dotenv';
import autoprefixer from 'autoprefixer';
import remarkGfm from 'remark-gfm';
import path from 'path';
import cloudflare from '@astrojs/cloudflare';
const prettyCodeOptions = {
  theme,
  onVisitHighlightedLine(node) {
    node?.properties?.className
      ? node.properties.className.push("highlighted")
      : (node.properties.className = ["highlighted"]);
  },
  onVisitHighlightedChars(node) {
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
  env: {
    schema: {
      SITE_URL: envField.string({ context: "client", access: "public", optional: true}),
    }
  },
  vite: {
    css: {
      postcss: {
        plugins: [tailwind, autoprefixer, tailwindcssNesting]
      }
    },
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@icons': '/src/components/Icons',
        '@content': '/src/content',
        '@images': path.resolve('./src/images'),
        '@styles': '/src/styles',
        '@assets': '/src/assets',
        '@layouts': '/src/layouts',
        '@pages': '/src/pages',
        '@utils': '/src/utils',
        '@lib': '/src/lib',
      }
    }
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    robotsTxt(),
    mdx({
      jsx: true,
      jsxImportSource: 'react',
    }),
    react()],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    shikiConfig: { theme },
    remarkPlugins: [remarkGfm],
  },
  site: 'https://simongreer.co.uk',
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
      tailwind: {},
      tailwindcssNesting: {}
    },
  },
  experimental: {
    svg: false,
  },
  output: 'server',
  adapter: cloudflare(),
})
