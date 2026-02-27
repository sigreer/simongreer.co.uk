# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `bun dev` - Clears Astro cache, syncs types, and runs dev server with force reload
- **Start (quick)**: `bun start` - Generates Wrangler types and starts dev server (no cache clear)
- **Build**: `bun run build` - Generates Wrangler types and builds the site for production
- **Preview**: `bun run preview` - Builds and previews with Wrangler Pages dev server
- **Deploy preparation**: `bun run deploy` - Prepares site for deployment (still requires GitHub push)
- **Lint and format**: `bun run lint` - Runs Prettier and ESLint with auto-fix
- **Sync**: `bun run sync` - Clears and syncs Astro type definitions
- **Full reset**: `bun run purge` - Complete cleanup and reinstall of dependencies
- **Update deps**: `bun run update` - Install, update, and upgrade all dependencies
- **PageSpeed report**: `bun run pagespeed` - Runs PageSpeed Insights and sends results to Mattermost
- **Tag management**: `bun run tags` - Updates and validates tag collections
- **Icon helper**: `bun run icons` - Icon component management CLI (add suffixes, create icons, inject frontmatter)
- **Push preview**: `bun run push-preview` - Pushes to main branch for preview deployment
- **Publish**: `bun run publish` - Safe production deployment (merges main → production with safety checks)

## Architecture Overview

This is a personal website and blog built with **Astro 5.x**, **React 19**, **Tailwind CSS 3**, and deployed on **Cloudflare Pages**.

### Core Stack

- **Framework**: Astro 5.x with React 19 integration and static output
- **Deployment**: Cloudflare Pages with edge workers (`wrangler.toml`)
- **Styling**: Tailwind CSS 3 with custom theme extensions, CSS custom properties, and typography plugin
- **Content Management**: Astro content collections with MDX support and Zod schemas
- **Package Manager**: Bun (uses `bun.lockb`)
- **UI Components**: shadcn/ui-style components using Radix UI primitives and CVA (class-variance-authority)

### Key Directories

```
src/
├── components/      # React (.tsx/.jsx) and Astro (.astro) components
│   ├── Content/     # Page content sections (testimonials, pricing)
│   ├── ContentBoxes/# Card, grid, and layout components
│   ├── Filter/      # Filtering and tag components
│   ├── Footer/      # Footer and branding
│   ├── Header/      # Navbar, dark mode toggle, pre-header
│   ├── Icons/       # 200+ Material Design icon components (.astro)
│   ├── Inline/      # CodeBlock, ExternalLink, Comments (Disqus)
│   ├── Me/          # Personal profile, contact form, interests
│   ├── Media/       # Gallery, carousels (Embla), lightbox, slideshows
│   ├── SocialIcons/ # Social media icon components
│   └── ui/          # shadcn/ui-style components (button, card, dialog, etc.)
├── content/         # Content collections (blog, projects, tech, clients, testimonials, tags)
├── images/          # Source images (covers, galleries, logos, vendor icons)
├── layouts/         # Astro layout components
├── lib/             # Utilities: cn() helper, syntax theme JSON
├── pages/           # File-based routing
├── styles/          # Global CSS files (globals, codeblock, lightbox, etc.)
├── types/           # TypeScript definitions (global.d.ts, lucide-react.d.ts)
└── utils/           # Collection helpers, color utils, gallery helpers, etc.
scripts/             # Shell/Node helper scripts and benchmarking suite
workers/             # Cloudflare Workers (benchmark proxy)
public/              # Static assets (fonts, favicons, manifest, redirects)
```

### Page Routes

```
src/pages/
├── index.astro          # Home page (tech grid showcase)
├── home.astro           # Secondary home variant
├── get-in-touch.astro   # Contact page
├── rss.xml.js           # RSS feed generator
├── api/
│   └── send-email.ts    # Email API route (SSR, not pre-rendered)
├── blog/
│   ├── index.astro      # Blog listing
│   └── [id].astro       # Dynamic blog post pages
├── tech/
│   ├── [id].astro       # Dynamic tech pages
│   └── projects/        # Tech project sub-routes
├── hire-me/
│   ├── index.astro      # Main hire-me page
│   └── *.astro          # Category pages (web-dev, cloud, networking, etc.)
└── me/
    ├── index.astro      # About me
    ├── personally.astro # Personal interests
    ├── professionally.astro
    └── get-in-touch.astro
```

### Layouts

- **BaseLayout.astro** - Primary layout with header, footer, metadata, and theme support
- **HomeLayout.astro** - Two-column home page layout (props: title, leftcol, rightcol)
- **PageLayout.astro** - Simple page wrapper
- **PostLayout.astro** - Blog post layout with table of contents and metadata
- **TestLayout.astro** - Layout for test/benchmark pages

### Content Collections

Defined in `src/content/config.ts` with Zod schemas. All use `glob()` loaders except tags (JSON file).

| Collection | Loader | Key Fields |
|---|---|---|
| `blog` | glob (MDX) | title, slug, description, pubDate, status, coverimage, tags (ref), category |
| `projects` | glob (MDX) | title, slug, description, pubDate, status, contentType (article/snippet), client (ref), tags (ref) |
| `tech` | glob (MDX) | title, slug, description, pubDate, status, category, hireme_filter, vendor_*, tags (ref) |
| `clients` | glob (MDX) | name, description, industry, tags (ref), horizontal_logo, contact_name |
| `testimonials` | glob (MDX) | headline, description, client (ref), project (ref), tags (ref), status |
| `tags` | file (JSON) | name, description, color, synonyms, category |

**Status values**: `draft`, `published`, `archived`, `hidden` (all collections except tags)

**Tech categories**: `development`, `cloud`, `systems`, `business`, `ai-automation`, `data`, `media`

### Path Aliases

Configured in both `tsconfig.json` and `astro.config.mjs`:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@icons/` → `src/components/Icons/`
- `@content/` → `src/content/`
- `@images/` → `src/images/`
- `@styles/` → `src/styles/`
- `@assets/` → `src/assets/`
- `@layouts/` → `src/layouts/`
- `@pages/` → `src/pages/`
- `@utils/` → `src/utils/`
- `@lib/` → `src/lib/`

### Component Patterns

- **Astro components** (`.astro`) for static content, layouts, and icons
- **React components** (`.tsx`/`.jsx`) for interactive elements: carousels (Embla), contact forms, dialogs
- **UI components** (`src/components/ui/`) follow shadcn/ui conventions with CVA for variants
- **Icons** (`src/components/Icons/`) are individual Astro components accepting `fill` and `class` props
- `cn()` utility from `src/lib/utils.ts` combines `clsx` + `tailwind-merge` for class merging

### Styling System

- **Global styles**: `src/styles/globals.css` defines CSS custom properties (HSL) for light/dark themes
- **Dark mode**: Class-based (`darkMode: ['class']` in Tailwind config)
- **Theme colors**: primary, secondary, accent, destructive, muted, themepink, themepurple, themeblue (all via CSS custom properties)
- **Fonts**: Geist Sans (body/sans), Geist Mono (monospace), Noto Serif (serif) - self-hosted in `public/fonts/`
- **Font scaling**: 16px base → 18px at lg → 19px at xl
- **Tailwind plugins**: `@tailwindcss/typography`, `tailwindcss-animate`, `tailwindcss-bg-patterns`
- **Safelist**: Dynamic pattern classes for hire-me pages
- **Additional CSS files**: `codeblock.css`, `emblaslider.css`, `lightbox.css`, `tags.css`, `toc.css`, `fonts.css`

### CSS Build Configuration

- **Code splitting**: Disabled (`cssCodeSplit: false`) - unified bundle for all pages
- **Inline stylesheets**: Disabled (`inlineStylesheets: 'never'`) - all CSS loaded as external files
- **PostCSS**: Tailwind, Autoprefixer, PostCSS Nesting
- **Minification**: esbuild
- **Sourcemaps**: Enabled in production builds

### Environment Variables

Uses Astro 5's `astro:env` API for type-safe environment variables defined in `astro.config.mjs`:

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

Since this project uses `wrangler.toml`, secrets cannot be managed via the Cloudflare dashboard. Use the Wrangler CLI:

```bash
wrangler pages secret put <SECRET_NAME> --project-name=simongreer
```

After setting secrets, trigger a new deployment for changes to take effect.

### Build Tools

- **Package Manager**: Bun (uses `bun.lockb`)
- **TypeScript**: Strict configuration extending `astro/tsconfigs/strict`, target ESNext, React JSX
- **Linting**: ESLint flat config (`eslint.config.cjs`) with Astro, React, TypeScript, and import plugins
- **Formatting**: Prettier (`prettier.config.cjs`) with Astro and Tailwind plugins
- **Code Highlighting**: Rehype Pretty Code with custom theme (`src/lib/syntaxtheme.json`) and copy button transformer
- **Markdown**: Remark GFM for GitHub-flavored markdown, Rehype Pretty Code for syntax highlighting

### Cloudflare Pages Deployment

- **Output Mode**: `static` with per-route SSR via `export const prerender = false`
- **Adapter**: `@astrojs/cloudflare` in directory mode
- **Build Output**: `./dist` directory
- **Platform Proxy**: Enabled for local development with wrangler
- **Compatibility Date**: 2024-09-23
- **Compatibility Flags**: `nodejs_compat`
- **Observability**: Enabled
- **Types**: Auto-generated via `wrangler types` into `worker-configuration.d.ts`

**Key Points:**
- Most pages are pre-rendered as static HTML at build time
- API routes (e.g., `/api/send-email`) use on-demand rendering with `export const prerender = false`
- Local preview uses `wrangler pages dev` after building
- Production in Vite uses `react-dom/server.edge` for Cloudflare compatibility

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

**Benchmarking Workflows:**
- `bench-full-suite.yml` - Manual full benchmark run across configs (baseline, Speed Brain, Astro prefetch)
- `bench-lighthouse.yml` - Reusable Lighthouse benchmark workflow
- `bench-compare.yml` - Reusable benchmark comparison workflow
- `deploy-bench.yml` - Deploys benchmark branches separately

**GitHub Secrets & Variables:**
- Environment: `simongreercouk`
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `MAILTRAP_*`, `PAGESPEED_API_KEY`, `PAGESPEED_WEBHOOK_URL`
- Variables: `SITE_URL`, `MAILTRAP_HOST`, `MAILTRAP_PORT`

### Helper Scripts

| Script | Command | Purpose |
|---|---|---|
| `scripts/publish.sh` | `bun run publish` | Safe production deploy (merges main → production with checks) |
| `scripts/push-preview.sh` | `bun run push-preview` | Push to main for preview deployment |
| `scripts/icon-helper.sh` | `bun run icons` | Icon management: add suffixes, create new icons, inject frontmatter |
| `scripts/update-tags.sh` | `bun run tags` | Update and validate tag collections |
| `scripts/pagespeed-report.cjs` | `bun run pagespeed` | PageSpeed Insights report → Mattermost |

### Performance Benchmarking

The `scripts/bench/` directory contains a benchmarking suite for comparing performance strategies:

- **`config.mjs`** - Shared config: default paths (`/`, `/blog`, `/tech`), metrics (LCP, FCP, TTFB, CLS, TBT, Speed Index), thresholds
- **`run-lighthouse.mjs`** - Lighthouse metric collection
- **`collect-metrics.mjs`** - General metric collection
- **`compare-reports.mjs`** - Side-by-side comparison of benchmark results
- **`run-webpagetest.mjs`** - WebPageTest integration
- **`run-web-vitals.mjs`** - Web Vitals metrics

Benchmarking variants: `v5-baseline`, `v5-speed-brain`, `v5-astro-prefetch`

### Development Notes

- Uses React 19 with compiler runtime for optimization
- SSR target is webworker for Cloudflare compatibility
- Image optimization supports avif, webp, png, jpeg formats
- Syntax highlighting uses custom theme from `src/lib/syntaxtheme.json`
- Prefetching enabled with viewport strategy
- Embla Carousel powers all carousels with autoplay and auto-height plugins
- Disqus integration for blog comments (`src/components/Inline/Comments.astro`)
- Recharts used for data visualization/charts
