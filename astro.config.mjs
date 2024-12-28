import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import syntaxTheme from './src/lib/syntaxtheme.json';
import robotsTxt from 'astro-robots-txt';
import postcssNesting from 'postcss-nesting';
import { transformerCopyButton } from '@rehype-pretty/transformers';
import rehypePrettyCode from 'rehype-pretty-code';
import autoprefixer from 'autoprefixer';
import remarkGfm from 'remark-gfm';
import dotenv from 'dotenv';
dotenv.config();
const prettyCodeOptions = {
  syntaxTheme,
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

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      SITE_URL: envField.string({ context: "client", access: "public", optional: true}),
      MAILTRAP_API_KEY: envField.string({ context: "server", access: "secret", optional: false }),
      MAILTRAP_FROM_EMAIL: envField.string({ context: "server", access: "secret", optional: false }),
      MAILTRAP_TO_EMAIL: envField.string({ context: "server", access: "secret", optional: false })
    }
  },
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@astrojs/react']
    },
    ssr: {
      noExternal: ['dotenv', '@astrojs/cloudflare', '@astrojs/react'],
      target: 'webworker',
      external: [
        'path',
        'fs',
        'url',
        'module',
        'crypto',
        'os',
        'child_process',
        'util',
        'net',
      ]
    },
    css: {
      postcss: {
        plugins: [tailwind, autoprefixer, postcssNesting]
      }
    },
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@icons': '/src/components/Icons',
        '@content': '/src/content',
        '@images': '/src/images',
        '@styles': '/src/styles',
        '@assets': '/src/assets',
        '@layouts': '/src/layouts',
        '@pages': '/src/pages',
        '@utils': '/src/utils',
        '@lib': '/src/lib',
      }
    },
    build: {
      sourcemap: true,
      profile: true,
    },
  },
  site: 'https://simongreer.co.uk',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    robotsTxt(),
    mdx({
      jsx: true,
      jsxImportSource: 'react',
    }),
    react({
      include: ['**/react/*'],
      experimentalReactChildren: true
    }),
    sitemap()],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    shikiConfig: { syntaxTheme },
    remarkPlugins: [remarkGfm],
  },
  postcss: {
    plugins: [
      postcssNesting(),
      tailwind(),
      autoprefixer()
    ]
  },
  experimental: {
    svg: false,
  },
  prefetch: {
    defaultStrategy: 'viewport'
  },
  output: 'static',
  image: {
    
    formats: ['avif', 'webp', 'png', 'jpeg']
  },

  adapter: cloudflare({  
    mode: 'directory', 

    platformProxy: {
      enabled: true,
      configPath: './wrangler.toml'
    }
  })
})
