import { defineConfig, envField } from 'astro/config'
import cloudflare from '@astrojs/cloudflare';
import dotenv from 'dotenv';
dotenv.config();

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
    ssr: {
      noExternal: ['dotenv', '@astrojs/cloudflare'],
      target: 'webworker',
      external: ['path','fs','url','module','crypto','os','child_process','util','net'],
    },
    resolve: {
      alias: {
        '@': '/src',
      }
    },
  },
  site: process.env.SITE_URL,
  output: 'static',
  adapter: cloudflare({  
    mode: 'directory', 
    platformProxy: {
      enabled: true,
      configPath: './wrangler.toml'
    }
  })
})
