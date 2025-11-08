# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `bun dev` - Runs Astro development server with sync and force reload
- **Build**: `bun run build` - Generates Wrangler types and builds the site for production
- **Preview**: `bun run preview` - Builds and previews with Wrangler Pages dev server
- **Deploy preparation**: `bun run deploy` - Prepares site for deployment (still requires GitHub push)
- **Lint and format**: `bun run lint` - Runs Prettier and ESLint with auto-fix
- **Sync**: `bun run sync` - Clears and syncs Astro type definitions
- **Full reset**: `bun run purge` - Complete cleanup and reinstall of dependencies

## Architecture Overview

This is a personal website and blog built with **Astro**, **React**, **Tailwind CSS**, and deployed on **Cloudflare Pages**.

### Core Structure

- **Framework**: Astro 5.x with React 19 integration and static output
- **Deployment**: Cloudflare Pages with edge workers (`wrangler.toml`)
- **Styling**: Tailwind CSS with custom theme extensions and typography plugin
- **Content Management**: Astro content collections with MDX support

### Content Collections

The site uses Astro's content collections system with the following types:
- `blog` - Blog posts with MDX support
- `projects` - Portfolio projects  
- `tech` - Technology/service pages
- `clients` - Client information
- `testimonials` - Client testimonials
- `tags` - Centralized tagging system loaded from JSON

All collections support draft/published/archived/hidden status and use file-based loading from their respective directories.

### Key Directories

- `src/content/` - All content collections (blog, projects, tech, etc.)
- `src/components/` - React components organized by feature
- `src/layouts/` - Astro layout components (BaseLayout, PostLayout, etc.)
- `src/pages/` - File-based routing with both Astro and dynamic routes
- `src/utils/` - Utility functions including gallery helpers and color utilities
- `src/styles/` - Global styles and Tailwind customizations

### Path Aliases

The project uses extensive path aliases configured in both `tsconfig.json` and `astro.config.mjs`:
- `@/` → `src/`
- `@components/` → `src/components/`
- `@icons/` → `src/components/Icons/`
- `@content/` → `src/content/`
- `@images/` → `src/images/`
- `@styles/` → `src/styles/`
- `@layouts/` → `src/layouts/`
- `@utils/` → `src/utils/`
- `@lib/` → `src/lib/`

### Environment Variables

The site uses Astro 5's `astro:env` API for type-safe environment variables defined in `astro.config.mjs`:

**Client-side (public):**
- `SITE_URL` - Site URL (optional, defaults to https://simongreer.co.uk)

**Server-side (secrets - runtime only):**
- `MAILTRAP_API_KEY` - Mailtrap API authentication key
- `MAILTRAP_FROM_EMAIL` - Email sender address
- `MAILTRAP_TO_EMAIL` - Email recipient address

**Server-side (public - runtime only):**
- `MAILTRAP_HOST` - SMTP host (optional, defaults to live.smtp.mailtrap.io)
- `MAILTRAP_PORT` - SMTP port (optional, defaults to 587)
- `MAILTRAP_API_USER` - API username (optional, defaults to "api")

**Important Notes:**
- Environment variables are accessed via `import { VAR_NAME } from 'astro:env/server'` for server secrets
- Local development: All server variables must be set in `.dev.vars`
- Production deployment:
  - **Non-sensitive vars** are defined in `wrangler.toml` under `[vars]`
  - **Secrets** must be set via Wrangler CLI (see below)
- Run `wrangler types` to regenerate TypeScript types in `worker-configuration.d.ts`

**Setting Secrets for Production:**

Since this project uses `wrangler.toml`, secrets cannot be managed via the Cloudflare dashboard. Use the Wrangler CLI to set secrets individually (you'll be prompted to enter values):

```bash
wrangler pages secret put <SECRET_NAME> --project-name=<PROJECT_NAME>
```

After setting secrets, trigger a new deployment for changes to take effect.

### Build Tools

- **Package Manager**: Bun (uses `bun.lockb`)
- **TypeScript**: Strict configuration with React JSX
- **Linting**: ESLint flat config with Astro, React, and TypeScript plugins
- **Formatting**: Prettier with Astro and Tailwind plugins
- **Code Highlighting**: Rehype Pretty Code with custom transformers

### CSS Optimization

The site uses optimized CSS bundling for performance:

- **Code Splitting**: CSS is split per page/layout (homepage: ~79KB, blog: ~6.9KB, carousel: ~2.8KB)
- **Tailwind Plugins**: Uses `@tailwindcss/typography`, `tailwindcss-animate`, and `tailwindcss-bg-patterns`
- **Critical CSS**: Automatically inlines small CSS files (<4KB) via `inlineStylesheets: 'auto'`
- **Purging**: Tailwind configured to purge unused styles, with safelist for dynamic pattern classes
- **Resource Hints**: DNS prefetch and preconnect for external fonts

**Performance Results:**
- Mobile PageSpeed: 98%
- Desktop PageSpeed: 100%
- Gzipped CSS transfer: ~13.8 KB for homepage

### Cloudflare Pages Deployment

The site is deployed to **Cloudflare Pages** (not Workers) with the following configuration:

- **Output Mode**: `static` with per-route SSR via `export const prerender = false`
- **Adapter**: `@astrojs/cloudflare` in directory mode for SSR support
- **Build Output**: `./dist` directory
- **Platform Proxy**: Enabled for local development with wrangler
- **Compatibility Date**: 2025-10-31
- **Compatibility Flags**: `nodejs_compat`, `disable_nodejs_process_v2`
- **Types**: Auto-generated via `wrangler types` into `worker-configuration.d.ts`

**Key Points:**
- Most pages are pre-rendered as static HTML at build time
- API routes (e.g., `/api/send-email`) use on-demand rendering with `export const prerender = false`
- Deployment happens via GitHub Actions workflows:
  - `.github/workflows/cfpages.yml` - Dev/preview deployments (main branch)
  - `.github/workflows/deploy-production.yml` - Production deployments (production branch)
- Local preview uses `wrangler pages dev` after building

### GitHub Actions Workflows

**Dev Deployments** (`.github/workflows/cfpages.yml`):
- Triggers on push to `main` branch and pull requests
- Deploys to preview URL (typically `https://main.simongreer.pages.dev`)
- Captures deployment URL from Cloudflare wrangler-action output
- Runs PageSpeed analysis on the actual deployed preview URL
- PageSpeed reports sent to Mattermost webhook

**Production Deployments** (`.github/workflows/deploy-production.yml`):
- Triggers on push to `production` branch
- Deploys to production URL (`https://simongreer.co.uk`)
- Runs PageSpeed analysis on production site
- No arbitrary delays - job dependencies ensure proper sequencing

**GitHub Secrets & Variables:**
- Environment: `simongreercouk`
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `MAILTRAP_*`, `PAGESPEED_API_KEY`, `PAGESPEED_WEBHOOK_URL`
- Variables: `SITE_URL`, `MAILTRAP_HOST`, `MAILTRAP_PORT`

### Development Notes

- Uses React 19 with compiler runtime for optimization
- SSR target is webworker for Cloudflare compatibility
- Image optimization supports avif, webp, png, jpeg formats
- Syntax highlighting uses custom theme from `src/lib/syntaxtheme.json`
- Prefetching enabled with viewport strategy