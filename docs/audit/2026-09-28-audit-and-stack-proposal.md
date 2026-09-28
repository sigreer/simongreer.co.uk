# simongreer.co.uk: Codebase Audit, Publishing Review and Stack Proposal

Date: 2026-09-28. Status: proposal, awaiting approval.

This document has three parts. Part 1 audits the current codebase. Part 2 reviews how the site is published and how Cloudflare is configured. Part 3 proposes a new stack, treating the current site as a visual reference only. A separate content overhaul plan will follow once the stack is agreed.

Security-sensitive findings are deliberately omitted from this file because the repository is public. They were reported directly in the working session.

---

## Part 1: Codebase audit

### 1.1 Shape of the codebase

| Area | Count | Notes |
|---|---|---|
| Astro components | ~215 | 163 of these are individual Material icon files |
| React components | 19 | Only 3 ever hydrate in the browser |
| Pages | 27 routes | 24 static, 1 SSR API route, 2 meta-refresh stubs |
| Content entries | 81 | blog 14, tech 61, projects 3, clients 2, testimonials 1 |
| Tags | 86 | JSON file loader |
| CSS files | 9 (730 lines) | 3 never imported, 1 duplicated in 17 places |
| Source images | 17 MB | ~2 MB of it unreferenced |
| Built output | 25 MB, 97 HTML pages | 8.8 MB of that is the worker bundle and source maps |

The site is a static Astro build with one server route (contact email). React is present mostly as decoration: badges, buttons and lucide icons are rendered server-side inside Astro pages with no client directive. The only client-side React is two contact forms and one Embla carousel used in a single blog post.

### 1.2 Functional bugs found (live site checked where possible)

Confirmed on the live site:

- **RSS feed links are all broken.** Every item links to `/blog/undefined/` because `rss.xml.js` reads `post.slug`, which does not exist on Astro 5 content entries.
- **Draft and hidden posts are published.** The `[id]` routes for blog, tech and projects never filter by `status`. Five draft/hidden posts have public URLs (for example `/blog/ai-fails/`).
- **The contact API accepts anything.** An empty JSON POST returns "Email sent successfully". No validation, no rate limit, no bot protection, no origin check.

Found by static reading, not reproduced live:

- Routes and links disagree on the identifier. Blog and project routes use the file `id`; every link uses the frontmatter `slug`. Three published posts have a slug that differs from their filename, and one project slug contains `.mdx`.
- `hire-me/cloud-and-hosted` filters on `business`, so it duplicates the business-apps page. Nine tech entries tagged `cloud-and-hosted` appear nowhere.
- Two tech entries share the slug `langchain` (flowise.mdx and langchain.mdx), so their routes collide.
- Tech page vendor logos never render: the glob points at `vendor-horizontal-logos/`, which does not exist.
- 25 tag ids used in content are undefined in `tags.json`; 7 defined tags are unused. One testimonial references a client id that does not exist.
- `/me` is an empty page (0 bytes) that relies on a `_redirects` rule. `/tech` has no index page but is linked from the nav's active-state logic and the benchmark config.
- Every hire-me page has the `<title>` "Tech Stuff". No page sets a description, canonical, Open Graph, Twitter or JSON-LD metadata.
- The blog post hero image is `loading="lazy"`, which hurts LCP on the page type that matters most.
- The dark-mode toggle lives in the pre-header, which is hidden below the `md` breakpoint, so mobile users cannot toggle theme.
- Hire-me and me/professionally use fixed 3/7 and 3/6 grid splits with no responsive stacking.

### 1.3 Dead code

Roughly a third of the source tree is unreachable.

- **Components never imported:** TagCloud, SocialIcons (root), GetInTouch.tsx, TestimonialsSection, FunnyFinds, RecentListening, RecentViewing, ContactInfo, CodeBlock, Comments (a Flowbite mock with fake users, not Disqus), FigCaption, GoBack, ImageSlideshow, ScreenshotCarousel, InteractiveCarousel, TechStuff, _Resources, Navbar/Projects, DiscordIcon, ui/chart (363 lines), ui/carousel (260 lines), ui/card.
- **Icons:** 128 of 163 icon components are unused, plus stray files (`XIcon copy.astro`, `.astro.svg`, template SVGs).
- **Utilities:** collections.ts, galleryHelper.ts, suggestoBotDialog.ts, colorUtils.ts.
- **Styles:** tags.css, toc.css, suggestobot.css never imported. custom.css is a 5-line duplicate of a globals.css rule imported in 17 files.
- **Layouts and pages:** TestLayout, home.astro (orphan duplicate of index).
- **Dependencies:** sass (no .scss files), tailwindcss-motion (not registered), recharts (only used by dead chart.tsx), path (Node built-in shim), dotenv (only bench scripts).
- **Assets:** `src/images/icons` (113 files) unreferenced, `src/images/currently` (1.5 MB) only used by dead components, 7 Inkscape backup SVGs committed, `public/js/tagColors.js` never loaded although two components call the function it would define.
- **Duplication:** four carousel implementations, three contact forms with identical fetch logic, five card variants, 11 hire-me pages that are ~95% identical copy-paste (a single data-driven `[category].astro` would remove ~1,900 lines).

### 1.4 Code quality

- `src/types/lucide-react.d.ts` declares the whole module as `any`, discarding lucide's shipped types.
- Three `@ts-ignore` on `astro:content` imports. Window augmentation declared twice.
- `tailwindColorMap.ts` hand-copies the Tailwind palette (274 lines) instead of importing `tailwindcss/colors`.
- Image lookup uses eager `import.meta.glob` on whole folders then string-keys by frontmatter filename. Typos fail silently to null. The `image()` schema helper would validate at build time.
- Content config lives at `src/content/config.ts`; Astro 5+ expects `src/content.config.ts`.
- `mode: 'directory'` in the adapter config is a removed option and is silently ignored.
- CLAUDE.md is stale in several places: two-column HomeLayout, self-hosted Noto Serif, Disqus integration, clients having a status field.

### 1.5 Styling architecture

The site has a shadcn-style HSL token layer, but most pages bypass it with hard-coded Tailwind palette colours and hex values.

- Token usage: `bg-background` 81 uses. Hard-coded: `white` 158, `neutral-800` 84, `gray-200` 80, `gray-800` 56, `border-[#dcdde0]` 64.
- `themeblue` token: 0 uses. `chart-1..5`: only in dead code. `--theme-pink/purple/blue` are not redefined in dark mode.
- 177 arbitrary values, ~40 `!important` usages, 82 `@apply` (39 in a dead file).
- Longest class string: 42 tokens / 627 characters (HomeBanner).
- `maxWidth` in the Tailwind config overrides the default scale, so `max-w-lg` means 1024px site-wide.
- `serif` font stack falls back to `sans-serif`. Noto Serif is not shipped.
- Three plugins (bg-patterns, animate, typography) are each used in exactly one place.

### 1.6 Visual identity to preserve

This is the reference for the rebuild. Values are from the current CSS.

**Palette**

| Role | Light | Dark |
|---|---|---|
| Page background | `hsl(0 0% 100%)` on a `gray-100` body | `hsl(0 0% 8%)` |
| Foreground | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` |
| Brand pink | `hsl(333 71% 50%)` ≈ #DA2676 | same |
| Brand purple | `hsl(288 70% 62%)` ≈ #C95BE6 | same, used for headings |
| Brand blue | `hsl(224 65% 33%)` ≈ #1D3A8A; in practice Tailwind `blue-900` | replaced by background |
| Borders | `#c8c9cc` (nav), `#dcdde0` (panels), `#9b9b9b` (cards) | `neutral-800` |
| Logo | circles #ff63d5, #4200a0, gray-600 | third circle white |

**Type:** Geist Sans (variable, self-hosted) for everything, Geist Mono for code. Root size 16px, 18px at 1024px, 19px at 1280px. Section headings are small, semibold, uppercase. Body text in cards is 14px, in prose 16px justified grey.

**Shell:** a centred 1360px column on a light grey page. A two-part header reads as one attached block: a 40px blue pre-header (social icons left, theme toggle right) with rounded top corners, then a white 64px navbar with rounded bottom corners (logo left, three items right, active item is a pink pill, hover is pale purple). Footer mirrors this: a blue block with three columns (recent posts, links, "powered by" logos) and a pink bottom bar with the site name.

**Home:** a full-width hero banner for the latest post (blue gradient, AVIF cover, pink date top-left, white title bottom-left, animated chevron bottom-right), then "RECENT BLOG POSTS" and a 1/2/3/4-column card grid.

**Cards:** white, `rounded-md`, thin grey border, hover lifts with shadow and 5% scale. Date chip top-right, 16:9 cover over a pink gradient, title (2-line clamp), description (5-line clamp), coloured tag chips.

**Blog post:** 2/7 grid with a sticky table of contents on the left, cover image in a white 4px frame, centred title, prose with underlined purple headings in dark mode, code blocks with a dark titlebar and hover copy button.

**Hire-me:** 3/7 split. Left panel: vendor tile grid (80px squares with vendor-coloured borders that expand on hover), pink skill badges, cross-hatch pattern strip, embedded contact form. Right panel: sections with pink icon headings, pros/cons columns, lightbox screenshot thumbnails.

**Motion:** light. Card hover, icon hover scale, chevron nudge, dialog fade/zoom. View transitions between pages.

---

## Part 2: Publishing and Cloudflare review

### 2.1 How it works today

- Branching: `main` deploys to preview (`main.simongreer.pages.dev`), `production` deploys to the live site. `scripts/publish.sh` merges main into production locally and pushes.
- GitHub Actions: `cfpages.yml` (push/PR to main) and `deploy-production.yml` (push to production) build with Bun and deploy with `cloudflare/wrangler-action@v3` to Pages project `simongreer`. Each then runs PageSpeed Insights and posts to Mattermost.
- Cloudflare Pages: project `simongreer`, production branch `production`, custom domains apex and www via proxied CNAME to `simongreer.pages.dev`. The project is **also** connected to the GitHub repo with Cloudflare's own build (`bun run astro build`), so pushes have historically triggered two deployments per commit (one `github:push`, one `ad_hoc` from Actions).
- Runtime: Pages advanced mode with a `_worker.js` bundle for the single SSR route and the image endpoint. Compatibility date 2024-09-23 with `nodejs_compat`.
- Zone: TLS strict, Always HTTPS on, HTTP/3 on, Early Hints on, 0-RTT on. Speed Brain off. Min TLS 1.0. One cache rule exists but is disabled. No transform, redirect or page rules.

### 2.2 Findings

Configuration and correctness:

- **Deploy jobs never see the environment secrets.** Only the PageSpeed job declares `environment: simongreercouk`, where the Mailtrap secrets live. The build steps' `MAILTRAP_*` env blocks are therefore empty and misleading (runtime secrets come from the Pages project, which is why email still works).
- **Two deploys per push.** Cloudflare's git integration and GitHub Actions both deploy. Pick one.
- **PR builds overwrite the main preview alias** because `cfpages.yml` deploys PRs with `--branch=main`.
- **The production branch is unprotected**, contrary to DEPLOYMENT.md, and `publish.sh` never builds, lints or checks CI status before pushing. A merge conflict leaves you checked out on production.
- **Both benchmark reusable workflows are invalid** (`if: ${{ secrets.X != '' }}` is not allowed) and have never run. The Speed Brain proxy worker sets the `Speculation-Rules` header to inline JSON, which browsers ignore, and CI benchmarks the pages.dev URL which never passes through the proxy. No `bench/*` branch was ever pushed.
- Toolchain is unpinned (`setup-bun@v1`, `bun-version: latest`, no `--frozen-lockfile`, no dependency cache, no `concurrency` group).
- `wrangler.toml` has no preview environment, so preview deployments run with the production `SITE_URL`.
- `worker-configuration.d.ts` (354 KB, generated) is tracked and regenerated on every build.
- `bun run purge` deletes `bun.lockb`, which no longer exists, and fails.

Performance and caching:

- **HTML is never edge-cached** (`cf-cache-status: DYNAMIC`, `max-age=0, must-revalidate`). For a static site, this is the single biggest cheap win.
- **No `public/_headers` file.** Hashed assets in `/_astro/*` and fonts are revalidated on every visit instead of `immutable`. No security headers (CSP, HSTS, Referrer-Policy, X-Frame-Options).
- The generated `_routes.json` still sends `/blog`, `/tech`, `/hire-me`, `/me`, `/robots.txt`, sitemaps and every 404 through the worker.
- Public source maps are shipped (`vite.build.sourcemap: true`), including an 872 KB client map.
- Two render-blocking CSS files load on every page despite `cssCodeSplit: false`.
- Speed Brain is off. Astro's viewport prefetch plus ClientRouter is on. The benchmarking effort to compare them never produced results.
- Minimum TLS 1.0 is weaker than necessary; 1.2 is the sensible floor.

### 2.3 Where the platform has moved

Verified against primary sources on 2026-09-28:

- **Astro 7.3** is current (7.0 shipped June 2026: Vite 8 / Rolldown, Rust compiler and Rust Markdown pipeline by default). Astro 6 stabilised the Fonts API, live collections and CSP. The site is on Astro 5.17.
- **Cloudflare acquired Astro** in January 2026. Astro stays MIT and hosting-agnostic, but the Cloudflare adapter is now the reference platform: dev and preview run on workerd, and there is an experimental Cloudflare CDN cache provider.
- **The Cloudflare adapter (v14) no longer supports Pages.** It targets Workers with Static Assets. Pages is not formally deprecated but is feature-frozen relative to Workers (no Vite plugin, no Workers Logs, no image binding, no gradual deployments, and Speed Brain does not work on pages.dev hosts).
- **`@astrojs/tailwind` is deprecated.** Tailwind is at 4.3 with CSS-first config via `@tailwindcss/vite`.
- **Cloudflare Email Service** (outbound) has been in public beta since April 2026 with a Workers binding. Sending to verified addresses is free on any plan.
- **Cloudflare launched the `cf` CLI today** (open beta) with a TypeScript `cloudflare.config.ts` format. Wrangler will get one final major and 18 months of maintenance. An Astro adapter v15 built on it was merged today but is unreleased.
- Native CSS features that were experimental two years ago are now Baseline: `@scope`, `light-dark()`, anchor positioning, container queries, native nesting, OKLCH and `color-mix()`. Scroll-driven animations are still flagged in Firefox. Cross-document view transitions are at ~88% support and the Astro community consensus is to drop `<ClientRouter />` for MPAs.

---

## Part 3: Proposed stack

Constraints taken as given: Astro, Cloudflare, the visual identity in section 1.6. Everything else is open.

### 3.1 Recommended stack at a glance

| Layer | Now | Proposed |
|---|---|---|
| Framework | Astro 5.17 | Astro 7.x, Node 22 / Bun 1.4 |
| Hosting | Cloudflare Pages, `wrangler.toml` | Cloudflare Workers with Static Assets, `@astrojs/cloudflare` 14, `wrangler.jsonc` |
| Rendering | Static + 1 API route | Static by default; Astro Actions for the form; server islands where live data is wanted |
| Styling | Tailwind 3 + shadcn tokens + 9 CSS files | Vanilla CSS design system: cascade layers, OKLCH tokens, `light-dark()`, container queries, `@scope`, Lightning CSS via Vite. No Tailwind. |
| Interactivity | React 19 (3 hydrated components) | No framework. Astro `<script>` and small web components. |
| Forms / email | Custom API route → Mailtrap | Astro Action + Zod → Cloudflare Email Service binding, Turnstile, rate limiting binding |
| Markdown / code | MDX + rehype-pretty-code + custom theme | MDX on the Rust pipeline + Expressive Code (dual theme, copy button, frames) |
| Fonts | Manual `@font-face` + preload | Astro Fonts API (local provider, generated fallbacks) |
| Images | `import.meta.glob` + string keys, public/ copies | `image()` schema fields, `<Picture>`, Cloudflare Images binding for on-demand transforms |
| Icons | 163 hand-made Astro components + lucide-react | `astro-icon` with Iconify sets (Material Symbols, Simple Icons for vendors) |
| Search | none | Pagefind (static, zero server cost) |
| OG images | none | Build-time satori via `astro-og-canvas` |
| Metadata | title only | Central SEO component: canonical, OG, Twitter, JSON-LD, RSS with correct links |
| Navigation | ClientRouter + viewport prefetch | Native cross-document view transitions + Speed Brain (or Astro prefetch, decided by measurement) |
| Caching | none | `_headers` immutable for hashed assets; edge-cached HTML with cache tags and purge-on-deploy via the adapter's cache provider |
| Lint / format | ESLint 9 + Prettier 2 | Biome 2.5 (lint + format for .astro/.ts/.css), Knip for dead code |
| Tests | none | Vitest 5 for content/schema/util tests; Playwright for a smoke suite and visual snapshots of key pages |
| CI / CD | GitHub Actions → Pages, duplicated with CF git builds | Workers Builds for deploy (preview URLs per branch, PR comments); one small GitHub Actions workflow for lint, test, Lighthouse |
| Analytics | none | Cloudflare Web Analytics (free, no cookies) |
| Observability | Pages default | Workers Logs + structured JSON logging from Astro 7 |

### 3.2 The decisions that matter, with alternatives

**A. Styling: vanilla CSS design system (recommended) vs Tailwind 4 vs a hybrid**

- *Vanilla CSS design system.* One `tokens.css` with OKLCH brand colours, `light-dark()` for theming (no `.dark` class juggling), fluid type with `clamp()`, cascade layers (`reset`, `tokens`, `base`, `layout`, `components`, `utilities`), Astro scoped `<style>` per component, container queries for cards and panels, `@scope` for prose. Lightning CSS (already inside Vite) handles nesting, prefixes and minification. Pros: zero styling dependencies, no class soup, tokens are enforced by construction, the output is small and readable, and it demonstrates the modern platform, which fits a site whose blog is about exactly this. Cons: no utility shortcuts for quick one-offs; requires discipline and a handful of hand-written utilities (stack, cluster, grid).
- *Tailwind 4.3.* CSS-first `@theme`, OKLCH, fast. Pros: familiar, fast for AI-driven iteration, shadcn v4 / Starwind available. Cons: the audit shows what happens over time without strict token discipline; still a build dependency and a mental model layered over CSS.
- *Hybrid.* Vanilla tokens plus a tiny utility layer (Open Props style). Reasonable, but two systems to keep consistent.

Recommendation: vanilla CSS. The site has ~10 distinct component shapes. That is small enough for a hand-built system to stay coherent, and it is the most "bleeding edge" honest choice.

**B. Interactivity: no framework (recommended) vs Preact vs keep React**

Only three things hydrate today: two contact forms and one carousel. A form is a `<form>` with an Astro Action and a few lines of script for progressive enhancement. A carousel is a scroll-snap container with two buttons. Dropping React removes 19 components, the React renderer from SSR, and roughly 180 KB of client JS. If an interactive island is ever genuinely needed, Preact or Svelte 5 can be added per-component later.

**C. Hosting model: Workers with Static Assets (recommended) vs staying on Pages**

The adapter has already dropped Pages support, so upgrading Astro forces this move anyway. Workers gives the image binding, Workers Logs, gradual deployments, the rate-limiting and email bindings, and Speed Brain on the custom domain. Configure with `wrangler.jsonc` now; migrate to `cloudflare.config.ts` when adapter v15 and the `cf` CLI leave beta. Do not adopt the beta CLI as the foundation of a rebuild today.

**D. CI/CD: Workers Builds (recommended) vs GitHub Actions only**

Workers Builds gives branch preview URLs, PR comments and deploy from the same place secrets already live, and it removes the double-deploy problem. Keep a single GitHub Actions workflow for the parts Cloudflare does not do: Biome, Vitest, Playwright smoke, Lighthouse CI on the preview URL, and the Mattermost report. Branching simplifies to: feature branches get previews, `main` is production, protected, merged by PR. The `production` branch and `publish.sh` go away.

**E. Contact form: Cloudflare Email Service (recommended) vs keep Mailtrap**

An Astro Action validates with Zod, verifies a Turnstile token, checks a Workers rate-limit binding, then calls `env.EMAIL.send()` to the verified destination address. This is free on the Workers free plan for a verified recipient and removes the Mailtrap dependency and its secret. Mailtrap remains a fallback if the beta proves unreliable.

**F. Navigation: native view transitions + Speed Brain (recommended) vs ClientRouter + Astro prefetch**

Drop `<ClientRouter />`. Use `@view-transition { navigation: auto }` with a named transition on the header and cards. This removes the "scripts only run once" class of bugs the audit found in the contact form and resize script. Speed Brain becomes usable once the site is on Workers behind the custom domain. This is one of the few places the old benchmarking question still applies; a small Playwright navigation timing test can settle it.

### 3.3 Coding approach

- **Fresh repository layout, not an in-place refactor.** Roughly a third of the code is dead and the styling layer is being replaced, so migrate content and images into a clean Astro 7 scaffold and rebuild ~10 components against the visual reference in 1.6. Keep the old repo as the reference.
- **Content-first schemas.** Drop the `slug` field (use the loader id, and add a `redirects` map for the three posts whose slugs differ). Use `image()` for covers and logos. Make `status` filtering a single `getPublished()` helper used by every route, RSS and sitemap. Fix the tag registry and validate references at build.
- **Data-driven pages.** One `hire-me/[category].astro` fed from the tech collection and a small `services` collection replaces 11 hand-copied pages. One `SEO.astro` in the base layout.
- **Component budget.** Header, Footer, Card, Hero, Prose, TOC, TechTile, Panel, Badge, Form, Lightbox, Carousel (scroll-snap). Each has a scoped stylesheet and uses only tokens.
- **Quality gates from day one.** Biome, Knip, `astro check`, Vitest for schema and helper tests, Playwright smoke and visual snapshots for home, a post, a hire-me page, in light and dark. Lighthouse CI thresholds on every preview.
- **Documentation.** CLAUDE.md rewritten for the new stack once it exists, not before.

### 3.4 Immediate fixes on the current site (independent of the rebuild)

These are worth doing this week regardless of the rebuild timeline.

1. Rotate the Mailtrap API key (see session notes).
2. Filter `status` in the three `[id]` routes so drafts stop being published.
3. Fix `rss.xml.js` to use `post.id`.
4. Add `public/_headers` with immutable caching for `/_astro/*` and `/fonts/*` plus baseline security headers.
5. Disconnect Cloudflare's git build for the Pages project, or delete the GitHub Actions deploy, so there is one deploy per push.
6. Raise minimum TLS to 1.2.

---

## Part 4: What happens next

1. Agree or amend the decisions in 3.2 (A to F).
2. Write the design spec for the rebuild and the implementation plan (phases: scaffold and tokens, shell and home, content routes, hire-me, forms and email, CI/CD and cutover).
3. In parallel, plan the content overhaul (sections to remove and add, copy updates, layout changes, quality-of-life features).
4. Cut over by pointing the apex and www CNAMEs at the new Worker, keeping the Pages project as a rollback for a week.
