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
  server: {
    host: '0.0.0.0'
  },
  env: {
    schema: {
      // Public client variables
      SITE_URL: envField.string({ context: "client", access: "public", optional: true, default: "https://simongreer.co.uk" }),

      // Server-only secrets (runtime - used in API routes)
      MAILTRAP_API_KEY: envField.string({ context: "server", access: "secret" }),
      MAILTRAP_FROM_EMAIL: envField.string({ context: "server", access: "secret" }),
      MAILTRAP_TO_EMAIL: envField.string({ context: "server", access: "secret" }),

      // Server-only public variables (runtime)
      MAILTRAP_HOST: envField.string({ context: "server", access: "public", optional: true, default: "live.smtp.mailtrap.io" }),
      MAILTRAP_PORT: envField.number({ context: "server", access: "public", optional: true, default: 587 }),
      MAILTRAP_API_USER: envField.string({ context: "server", access: "public", optional: true, default: "api" }),
    }
  },
  vite: {
    optimizeDeps: {
      include: [ 'react', 'react-dom' ],
      exclude: ['@astrojs/react']
    },
    ssr: {
      noExternal: ['@astrojs/cloudflare', '@astrojs/react'],
      target: 'webworker',
      external: ['path', 'fs', 'url', 'module', 'crypto', 'os', 'child_process', 'util', 'net']
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
      ...(import.meta.env.PROD && {
        "react-dom/server": "react-dom/server.edge",
      })}
    },
    build: {
      sourcemap: true,
      profile: true,
      cssCodeSplit: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    },
  },
  site: 'https://simongreer.co.uk',
  integrations: [tailwind({ applyBaseStyles: false }), robotsTxt(), mdx({
    jsx: true,
    jsxImportSource: 'react',
  }), react(), sitemap()
],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    shikiConfig: { syntaxTheme },
    remarkPlugins: [remarkGfm],
  },
  prefetch: {
    defaultStrategy: 'viewport'
  },
  output: 'static',
  build: {
    inlineStylesheets: 'never',
    assets: '_astro',
  },
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