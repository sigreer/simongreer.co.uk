# Design: simongreer.co.uk rebuild on Astro 7 and Cloudflare Workers

Date: 2026-09-28. Status: approved decisions, spec revision 2 (after review round 1).
Source of decisions: `docs/audit/2026-09-28-audit-and-stack-proposal.md`, section 3.2, all six points approved by Simon on 2026-09-28.

## 1. Goal

Rebuild the site as a fresh Astro 7 project deployed to Cloudflare Workers with Static Assets, reproducing the current visual identity (audit section 1.6) with a vanilla CSS design system, no client framework, and a validated, bot-protected contact form. Content (blog, tech, projects, clients, testimonials, tags) is migrated, not rewritten. Content changes are a separate later plan.

Out of scope: new sections, copy changes, layout redesign beyond responsive fixes, the benchmarking suite (deleted, not ported), and the immediate hot-fixes to the live site listed in audit section 3.4 (done separately on `main`).

## 2. Success criteria

Verifiable on the accepted preview revision (section 11.2) unless stated otherwise.

1. `bun run check` passes: zero `astro check` errors, zero Biome errors, `knip` reports no unused files, exports or dependencies. `bun run build` succeeds and `wrangler deploy --dry-run` succeeds.
2. **Route manifest.** `tests/unit/routes.test.ts` loads `docs/specs/route-manifest.json` (section 4.2) and asserts: every `keep` path exists in `dist/` as `index.html`; every `redirect` path appears in `public/_redirects` with its target and the target exists in `dist/`; no path listed as `drop` (drafts, hidden, archived, placeholders) exists in `dist/`.
3. `curl -s <preview>/rss.xml` contains no `undefined`; every `<link>` path, with the host replaced by the preview host, returns 200.
4. Playwright visual snapshots of `/`, `/blog`, one post, `/hire-me/web-development` and `/me/professionally`, in light and dark at 390px and 1360px, are reviewed and accepted by Simon against the live site.
5. Lighthouse (mobile, `@lhci/cli`) against the accepted preview revision scores ≥ 95 performance, 100 accessibility, 100 best practices, 100 SEO on `/`, `/blog`, and one post.
6. **Contact form**, tested in Playwright against the built Worker under `wrangler dev` with Turnstile test keys and `send_email` stubbed by Wrangler:
   - valid submission returns success and the stub logs a message with `Reply-To` set to the submitter;
   - invalid email, message under 10 characters, filled honeypot, and a failing Turnstile token (test "always fails" site key) each return a structured error and log no message;
   - the 4th submission from one client within 60 seconds returns `TOO_MANY_REQUESTS`.
   One manual end-to-end submission on the preview revision delivers a real email to the verified address.
7. `curl -sI <preview>/_astro/<hashed file>` returns `cache-control: public, max-age=31536000, immutable`. HTML responses carry `strict-transport-security`, `referrer-policy`, `x-content-type-options`, `x-frame-options` and `permissions-policy` headers, and the HTML contains one `<meta http-equiv="content-security-policy">` whose policy blocks inline scripts without a matching hash (verified by a Playwright test that injects an unhashed inline script and asserts a CSP violation event).
8. Client JavaScript shipped on a blog post page is under 15 KB compressed, excluding Pagefind's lazily loaded bundle. Turnstile's script loads only on pages containing the form.
9. Search: `bun run build` runs Pagefind; a Playwright test types a known post title into the search box and asserts the result links to that post.
10. No `react`, `tailwindcss`, `@astrojs/tailwind`, `sass` or Mailtrap-related package in `package.json`.

## 3. Architecture

### 3.1 Repository strategy

Same repository, new branch `rebuild/astro7` in a git worktree. The first commit deletes `src/`, `public/`, config files and the old workflows, then scaffolds Astro 7. Content and images are copied from `main` with `git checkout main -- src/content src/images public/fonts public/images` and then pruned. The old code stays readable on `main` until the merge in section 11.4.

### 3.2 Runtime topology

```
Browser ──> Cloudflare edge (zone simongreer.co.uk)
              ├─ static asset match ──> Workers Static Assets (HTML, _astro/*, pagefind/*, images)
              └─ no match ───────────> Worker (Astro server entry)
                                          ├─ /_actions/contact  (Astro Action, JSON/form-data over fetch)
                                          ├─ /_image            (runtime image transforms via IMAGES binding)
                                          └─ 404 page (not_found_handling: "404-page")
Bindings: ASSETS, EMAIL (send_email), CONTACT_RATE_LIMIT (ratelimit), IMAGES
Secrets:  TURNSTILE_SECRET_KEY
Vars:     SITE_URL, TURNSTILE_SITE_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
```

All pages are prerendered (`output: 'static'`). The only server-rendered endpoints are the Action and the image endpoint. `run_worker_first` is not set, so static assets never invoke the Worker. Bindings are accessed with `import { env } from 'cloudflare:workers'` (the adapter v14 contract; `Astro.locals.runtime` no longer exists).

### 3.3 Configuration files

- `astro.config.ts`: `site` from `SITE_URL`; `adapter: cloudflare({ imageService: { build: 'compile', runtime: 'cloudflare-binding' } })` so prerendered images are optimised at build and only runtime requests use the binding; `integrations: [expressiveCode(), mdx(), sitemap({ filter }), icon()]`; `fonts: [...]` with `fontProviders.local()` for Geist and Geist Mono; `security: { csp: { ... } }` (stable in 7.x; emits a `<meta http-equiv>` policy with per-page hashes); `prefetch: false`; no Tailwind plugin.
- `wrangler.jsonc`: `name: "simongreer-site"`, `compatibility_date` = scaffold date, `compatibility_flags: ["nodejs_compat"]`, `assets: { directory: "./dist", binding: "ASSETS", not_found_handling: "404-page" }`, `send_email: [{ name: "EMAIL", destination_address: "<verified address>" }]`, `ratelimits: [{ name: "CONTACT_RATE_LIMIT", namespace_id: "1001", simple: { limit: 3, period: 60 } }]`, `images: { binding: "IMAGES" }`, `observability: { enabled: true }`, `placement: { mode: "smart" }`, `vars` as above, `preview_urls: true`.
- `biome.json`, `knip.json`, `lighthouserc.json`, `playwright.config.ts`, `vitest.config.ts`.
- `public/_headers` and `public/_redirects` (section 9 and 4.2).

### 3.4 Directory layout

```
src/
  actions/index.ts          contact action
  components/               Header, Nav, ThemeToggle, Footer, Hero, Card, CardGrid, TagFilter,
                            Prose, Toc, Panel, Badge, TechTile, TechGrid, ContactForm,
                            Lightbox, Gallery, Carousel, ExternalLink, Seo, Search
  content/                  migrated MDX + tags.json + services.json
  content.config.ts
  icons/                    logo + vendor SVGs not in Simple Icons
  images/
  layouts/                  Base.astro, Page.astro, Post.astro
  lib/                      content.ts, seo.ts, turnstile.ts, email.ts
  pages/                    index, blog/index, blog/[id], tech/index, tech/[id],
                            tech/projects/index, tech/projects/[id],
                            hire-me/index, hire-me/[service], me/personally,
                            me/professionally, get-in-touch, rss.xml.ts,
                            og/[...path].png.ts, 404.astro
  styles/                   tokens.css, reset.css, base.css, layout.css, utilities.css
tests/
  unit/                     content.test.ts, routes.test.ts, seo.test.ts
  e2e/                      smoke.spec.ts, visual.spec.ts, contact.spec.ts, headers.spec.ts, search.spec.ts
docs/specs/route-manifest.json
```

## 4. Content model

### 4.1 Schema changes

All collections keep glob/file loaders. Changes:

- Remove `slug` from blog, tech and projects. The glob loader today already uses `slug` as the entry id when present, so current public URLs are slug-based. To preserve URLs without redirects, files whose filename differs from their slug are **renamed to the slug** (see 4.2). The id is then always the filename.
- `coverimage`, `vendoricon`, `horizontal_logo` become `image()` fields so a missing or misspelled file fails the build.
- `description` becomes required for blog and projects; stays nullable for tech and clients.
- Add `status` to clients and testimonials; migrated entries are set to `published`.
- Testimonials: drop the redundant `client_name` reference.
- Tech: keep `category` and `hireme_filter` enums. `hireme_filter` is validated against the union of `filters` declared in `services.json` (4.3). Unmatched filters fail the build.
- Tags: add the 25 missing tag definitions, delete the 7 unused ones, rename id `open source` to `open-source` and update references.
- Published entries referencing unpublished entries (project → client, testimonial → client/project) fail `tests/unit/content.test.ts`.

### 4.2 Route manifest

Routes: blog `/blog/<id>/`, tech `/tech/<id>/`, projects `/tech/projects/<id>/`, services `/hire-me/<service>/`.

The implementer generates `docs/specs/route-manifest.json` mechanically from `main` before deleting anything: for every content entry, record the current public path (from `slug ?? filename`), the new path, the action (`keep`, `redirect`, `drop`) and the reason. The known cases from the audit, to be confirmed by the generator:

| Current path | Action | New path / reason |
|---|---|---|
| `/blog/funky-square-dance-icon-set-svg` | keep | rename file `funkysquaredance-icon-set.mdx` → `funky-square-dance-icon-set-svg.mdx` |
| `/blog/is-wordpress-still-a-viable-choice-in-2025` | keep | rename file `...-2024.mdx` → `...-2025.mdx` |
| `/blog/truenas-scale-electric-eel` | keep | rename file `truenas-scale-electric-eel-first-look.mdx` |
| `/tech/open-zfs-filesystem`, `/tech/microsoft-windows` | keep | rename `openzfs.mdx`, `windows.mdx` |
| `/tech/langchain` (collision: flowise.mdx and langchain.mdx) | keep for langchain | `langchain.mdx` owns the path; `flowise.mdx` loses its `slug` and becomes `/tech/flowise/` (new page, no redirect, since the old path never showed Flowise reliably) |
| `/tech/projects/voip-...-cost.mdx` | redirect | `/tech/projects/voip-with-all-of-the-features-and-none-of-the-cost/` |
| 4 draft + 1 hidden blog posts | drop | status filter |
| `/tech/projects/another-project` | drop | placeholder entry deleted |
| `/home` | drop | orphan duplicate |
| `/me` | redirect | `/me/personally` (existing rule) |
| `/me/get-in-touch` | redirect | `/get-in-touch` (replaces the meta-refresh page) |
| `/hire-me/<old page>` × 10 | keep or redirect | per the services table in 4.3 |

Every `redirect` row becomes a line in `public/_redirects` with status 301.

### 4.3 Services collection

`src/content/services.json` (file loader) replaces the 11 hand-written hire-me pages. Fields: `id` (route segment), `title`, `navLabel`, `inNav` (boolean), `icon`, `intro`, `filters` (array of `hireme_filter` values whose tech entries appear in the vendor grid), `skills` (badge labels + icons), `sections` (heading, icon, body markdown, optional pros/cons, optional screenshots). Section body text is copied verbatim from the existing pages.

Mapping from existing pages and filters. Every one of the 10 existing `hireme_filter` values in use is claimed exactly once.

| Service id (route) | Source page | `filters` | Note |
|---|---|---|---|
| `web-development` | web-development | `web-development` | in nav |
| `business-apps` | business-apps | `business` | in nav |
| `cloud-and-hosted` | cloud-and-hosted | `cloud-and-hosted` | fixes the copy-paste bug that showed `business` |
| `networking-and-security` | networking-and-security + vpn-setup-routing-wireguard-ipsec-openvpn | `networking`, `broadcast-networking` | in nav; the VPN page's sections merge in; `/hire-me/vpn-setup-routing-wireguard-ipsec-openvpn` 301s here |
| `storage-and-nas` | storage-and-nas | `storage` | in nav |
| `software-development` | software-development | `software-development` | |
| `data-and-databases` | data-and-databases | `data-and-databases` | |
| `system-design-and-deployment` | system-design-and-deployment + system-administration | `design-and-deployment` | `system-administration` matched zero entries; its sections merge here and `/hire-me/system-administration` 301s here |
| `ai-and-automation` | new (sections from index intro) | `ai-automation` | 7 entries currently unreachable; minimal page, content plan may expand it |

`hireme_filter` enum values `system-administration` and `media-server` are removed from the schema (zero entries). `/hire-me/` index lists all services.

### 4.4 Publication helper

`src/lib/content.ts` exports `getPublished(collection)` = `getCollection(c, e => e.data.status === 'published')`. Every page, RSS, sitemap filter and related lookup uses it. In `astro dev`, `SHOW_DRAFTS=1` includes drafts.

### 4.5 MDX migration inventory

Real component imports in content (Dart `import` lines inside code fences are not imports):

| Content file | Imports | Migration |
|---|---|---|
| blog/astro-on-cloudflare-fully-automated (parts 1, 2, 3) | `@styles/lightbox.css`, `LightBox.astro`, 3–2 gallery PNGs | drop the CSS import (Lightbox is self-styled); import path becomes `@components/Lightbox.astro` with the same `src`/`alt`/`caption` props |
| blog/fedora-kernel-upgrades-with-zfs | `GithubIcon.astro` | replace with `<Icon name="simple-icons:github">` from astro-icon; 3 Tailwind `class` attributes replaced with prose-scoped utilities |
| blog/funkysquaredance-icon-set | `ExternalLink.astro`, `astro:assets` Image, 8 SVGs | keep; `ExternalLink` is rebuilt with the same props |
| blog/magick-tricks-automate-screenshot-cover-images | `Carousel` (React), `Gallery.astro`, 4 images by `/images/galleries/...` public path | `Carousel` becomes the new scroll-snap `Carousel.astro` with an `images` prop; `Gallery.astro` rebuilt with the same props; the 4 public images move to `src/images/galleries/magick-tricks/` and are imported |
| projects/lbwebrtc-embedded-linux-system-suite | `coverimage: /images/projects/lbwebrtc.jpg` (file missing) | provide the image or set a placeholder cover; build fails otherwise via `image()` |
| Tailwind classes in 4 MDX files (19 occurrences) | | replaced by `.prose` scoped classes or removed; documented in the migration commit |

Acceptance: `bun run build` succeeds and visual snapshots include the magick-tricks post (carousel and gallery) and part 1 of the Astro-on-Cloudflare series (lightbox) in addition to the pages in criterion 4.

## 5. Design system (CSS)

### 5.1 Layers and files

`@layer reset, tokens, base, layout, components, utilities;` declared once in `Base.astro`. Files:

- `tokens.css`: `:root { color-scheme: light dark; }` and all custom properties. Colours in OKLCH with `light-dark()` pairs, e.g. `--color-surface: light-dark(oklch(100% 0 0), oklch(20% 0 0))`. Brand: `--color-pink`, `--color-purple`, `--color-blue` converted from the audit HSL values. Semantic: `--color-bg-page`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-border-strong`, `--color-heading-accent` (text colour in light, purple in dark). Type: `--font-sans`, `--font-mono` (set by the Fonts API), fluid steps `--step--1` to `--step-4` via `clamp()` reproducing 16/18/19px root scaling. Space scale `--space-1` to `--space-10`. `--radius-sm/md/lg`, `--shadow-sm/md/lg`, `--container: 1360px`, `--motion-fast: 150ms`, `--motion-base: 300ms`.
- `reset.css`: modern reset with `prefers-reduced-motion` guard.
- `base.css`: html/body, headings, links, focus rings, `@view-transition { navigation: auto; }`, `view-transition-name` for header and footer.
- `layout.css`: `.container`, `.stack`, `.cluster`, `.grid-auto` (container-query driven), `.split` (3/7 panel split that stacks under 48rem).
- `utilities.css`: `.visually-hidden`, `.uppercase-label`, `.line-clamp-2`, `.line-clamp-5`, `.prose-icon`.
- Component styles live in each `.astro` file's scoped `<style>` using only tokens. `@scope (.prose)` in `Prose.astro` for Markdown output.

### 5.2 Theming

Theme follows `color-scheme` via `light-dark()`. `ThemeToggle.astro` sets `data-theme="light|dark"` on `<html>`, which overrides via `:root[data-theme="dark"] { color-scheme: dark }`, and persists to `localStorage`. A hashed inline script in `<head>` applies the stored value before first paint. The toggle appears in the mobile nav as well as the desktop pre-header. Navigation is cross-document, so no re-run-on-swap logic exists.

### 5.3 Motion

Card hover lift and scale, icon hover scale, hero chevron nudge, dialog fade, all under `@media (prefers-reduced-motion: no-preference)`. Cross-document view transitions with a 200ms crossfade; header and footer keep position via shared `view-transition-name`. Scroll-driven animation is not used.

## 6. Components

Each component: one file, scoped styles, typed `Props`, no global side effects. Interactive ones use a `<script>` that queries `document.querySelectorAll('[data-<component>]')`, skips elements already marked `data-ready`, and marks them, so multiple instances and repeated execution are safe. `document.currentScript` is not used (it is null in bundled module scripts).

| Component | Responsibility | Interactivity |
|---|---|---|
| `Seo` | title, description, canonical, OG/Twitter, JSON-LD (WebSite, BlogPosting, Person), RSS link, OG image URL | none |
| `Header` + `Nav` | pre-header (social icons, toggle) and navbar (logo, items, hire-me dropdown from `services` where `inNav`, mobile overlay) | `<details>`-based dropdown and mobile menu; small script closes on outside click |
| `ThemeToggle` | see 5.2 | ~20 lines |
| `Footer` | recent posts, links, powered-by, pink bar | none |
| `Hero` | latest post banner | none |
| `Card`, `CardGrid` | post/tech/project cards with tag chips, `data-tags` | none |
| `TagFilter` | tag buttons, toggles `hidden` on cards; state in `?tag=` | ~40 lines |
| `Prose` | Markdown container, `data-pagefind-body` | none |
| `Toc` | headings list, active state | IntersectionObserver, ~30 lines |
| `Panel` | bordered panel with header strip, optional cross-hatch strip via CSS `repeating-linear-gradient` | none |
| `Badge` | pill with Iconify icon | none |
| `TechTile`, `TechGrid` | vendor tiles with hover expand | CSS only (`:hover`, `:focus-within`) |
| `ContactForm` | form with Turnstile widget, JS submit to action, inline status; `<noscript>` shows a mailto link | ~60 lines |
| `Lightbox` | thumbnail opens native `<dialog>` with full image; props `src`, `alt`, `caption` as today | ~20 lines |
| `Gallery` | grid of `Lightbox` items; props as today | none beyond Lightbox |
| `Carousel` | scroll-snap list with prev/next buttons and dots; prop `images` | ~40 lines |
| `ExternalLink` | anchor with external icon, `rel="noopener"` | none |
| `Search` | Pagefind UI, bundle loaded on first focus | Pagefind |

Icons: `astro-icon` with `@iconify-json/material-symbols` for UI and `@iconify-json/simple-icons` for vendor and social marks. Custom SVGs only for the logo and vendors missing from Simple Icons, in `src/icons/`.

## 7. Contact form data flow

Pages stay static. The form never posts natively, because an HTML-form Action requires an on-demand page and Turnstile needs JavaScript anyway.

1. `ContactForm.astro` renders `<form data-contact>` with name, email, message, a honeypot input `website`, and the Turnstile widget (`TURNSTILE_SITE_KEY` from `astro:env/client`; the widget's allowed hostnames are `simongreer.co.uk`, the account's `<account-subdomain>.workers.dev` hostname (Turnstile rejects wildcards; a registered hostname covers its subdomains, so this admits every version-preview URL) and `localhost`). Its script intercepts submit, calls `actions.contact(new FormData(form))`, and renders the result into a live region. `<noscript>` contains "JavaScript is required for this form. Email me at <mailto>".
2. `src/actions/index.ts` defines `contact` with `accept: 'form'`, Zod input: `name` 1–100 chars, `email` `.email()`, `message` 10–5000 chars, `website` must be empty, `cf-turnstile-response` non-empty string.
3. Handler order, using `env` from `cloudflare:workers` and `ctx.clientAddress`: honeypot → `env.CONTACT_RATE_LIMIT.limit({ key: clientIp })` (3 per 60 s, enforced per Cloudflare location; an approximate abuse deterrent, not a strict global quota) → Turnstile `siteverify` with `TURNSTILE_SECRET_KEY` and `remoteip` → `sendContactEmail()` in `src/lib/email.ts`, which builds an `EmailMessage` (`cloudflare:email`, mimetext) from `CONTACT_FROM_EMAIL` to `CONTACT_TO_EMAIL` with `Reply-To` = submitter and calls `env.EMAIL.send()`. Returns `{ ok: true }`.
4. Errors throw `ActionError` with codes `BAD_REQUEST` (validation, honeypot), `TOO_MANY_REQUESTS`, `FORBIDDEN` (Turnstile), `INTERNAL_SERVER_ERROR` (email). The client shows the specific message for 4xx and, for 5xx, "Something went wrong sending your message. Email me directly at <mailto>". Upstream error bodies are logged as structured JSON and never returned.
5. Local development: `astro dev` and `wrangler dev` run the real Worker runtime; `send_email` is stubbed by Wrangler (message logged, not sent); Turnstile uses the documented always-pass and always-fail test keys via `.dev.vars`.

## 8. Metadata, feeds, images, search

- `Seo.astro` is used by `Base.astro`; every layout passes title and description. `SITE_URL` is the production URL on every deployment so canonical, OG and RSS URLs are always production URLs; tests rewrite the host when checking against a preview.
- `rss.xml.ts` uses `@astrojs/rss` with `getPublished('blog')` and `link: /blog/${post.id}/`.
- Sitemap filters to published routes.
- OG images: `src/pages/og/[...path].png.ts` generates 1200×630 PNGs at build with `astro-og-canvas`.
- Images: `<Picture formats={['avif','webp']}>` for covers and hero with layout-sized `widths`. `public/images/galleries` duplicates are removed (4.5).
- Fonts: Astro Fonts API, `fontProviders.local()` for the two Geist woff2 files, `cssVariable` `--font-sans` and `--font-mono`, generated fallbacks, preload for the sans face.
- Search: `postbuild` script runs `pagefind --site dist`; output lands in `dist/pagefind/`. Indexed content is whatever carries `data-pagefind-body`: blog posts, tech pages, project pages. Service pages are excluded.

## 9. Caching and headers

- `public/_headers`:
  - `/_astro/*`: `Cache-Control: public, max-age=31536000, immutable` (all filenames are content-hashed, including Fonts API output).
  - `/pagefind/*`: `Cache-Control: public, max-age=3600` (contains unhashed entry files).
  - `/*`: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`.
- CSP is emitted by Astro as a `<meta http-equiv="content-security-policy">` with per-page script and style hashes, plus `script-src` allowances for `challenges.cloudflare.com` and `static.cloudflareinsights.com`, `frame-src challenges.cloudflare.com`, `connect-src 'self'`. No nonces and no `strict-dynamic`, so Speed Brain remains compatible. A response-header CSP is not used because the hashes are per page. Astro's CSP does not support Shiki's inline styles, so Expressive Code must be configured to emit class-based styles (its default stylesheet) and the Phase 6 CSP task must verify no `style=` attributes remain in code blocks, falling back to hashing them if any do.
- HTML pages are static assets served from the edge. The Astro 7 Cloudflare cache provider is not adopted in this phase because no HTML is server-rendered.
- Zone changes at cutover: minimum TLS 1.2, Speed Brain on, the disabled "webcache-default" cache rule deleted.

## 10. Tooling and quality gates

- Bun 1.4 pinned via `packageManager` and `.bun-version`. Scripts: `dev`, `build` (astro build then pagefind), `preview` (`wrangler dev` on `dist`), `check` (astro check, biome check, knip), `test:unit` (vitest, source-only: content, seo), `test:routes` (vitest `tests/unit/routes.test.ts`, requires a fresh `dist/`), `test` (unit then build then routes), `test:e2e` (playwright against `wrangler dev`), `lighthouse` (lhci autorun against `$TARGET_URL`).
- Biome 2.5 replaces ESLint and Prettier. Knip in `check`.
- Vitest 5: `content.test.ts` (schemas load, no dangling tag refs, no duplicate ids, published entries only reference published entries) and `seo.test.ts` run before the build; `routes.test.ts` (criterion 2) runs only after `bun run build` in the same job and asserts `dist/index.html` is newer than the checkout.
- Playwright 1.63 against `wrangler dev`: `smoke.spec.ts` (every sitemap URL 200, no console errors), `visual.spec.ts` (criteria 4 and 4.5), `contact.spec.ts` (criterion 6), `headers.spec.ts` (criterion 7), `search.spec.ts` (criterion 9).
- Lighthouse CI with the thresholds in criterion 5.

## 11. CI/CD and cutover

### 11.1 Roles

- **Workers Builds** deploys the production branch of Worker `simongreer-site`. Build command `bun install --frozen-lockfile && bun run build`, deploy command `wrangler deploy`. Non-production branch builds are disabled in Workers Builds; previews come from CI instead so that every preview is tied to an exact commit.
- **GitHub Actions** `ci.yml` runs on pull_request and push: setup-bun@v2 pinned, `bun install --frozen-lockfile`, `bun run check`, `bun run test:unit` (source-only tests), `bun run build`, `bun run test:routes` (route-manifest assertions against the `dist/` just produced in this job; the job fails if `dist/` predates the checkout step), Playwright suites against `wrangler dev`, then `wrangler versions upload --tag <sha>` with `CLOUDFLARE_API_TOKEN` to create a **preview version** of the Worker (same bindings and secrets as production, no traffic), read the version preview URL from the command output, wait until it returns 200 for `/` (bounded to 2 minutes), run Lighthouse and the headers check against it, and post a Mattermost summary using the existing `PAGESPEED_WEBHOOK_URL`. `concurrency` keyed by ref. Repo-level secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PAGESPEED_WEBHOOK_URL`. The `simongreercouk` GitHub environment is deleted.

### 11.2 Accepted preview revision

The "accepted preview revision" in section 2 is the version preview URL produced by CI for the commit Simon approves. It runs with production bindings and secrets, so the email and Turnstile checks are real.

### 11.3 Branch protection

`main` protected: PR required, `ci` check required, linear history. `production`, `scripts/publish.sh` and `scripts/push-preview.sh` are deleted at step 8 below.

### 11.4 Cutover sequence

1. Create Worker `simongreer-site` and connect Workers Builds with production branch `rebuild/astro7`. Set `TURNSTILE_SECRET_KEY`. Verify the destination address for `send_email`.
2. Iterate on `rebuild/astro7` until CI is green and Simon accepts a preview revision (11.2). Workers Builds deploys the same commit to `simongreer-site.<account>.workers.dev` as a separate upload; record both version ids and confirm with `wrangler deployments list` that the active deployment's source SHA equals the accepted commit.
3. Domain transfer, executed as a written runbook with each step verified before the next:
   1. Record the current DNS records for `simongreer.co.uk` and `www.simongreer.co.uk` (type, content, proxied) with `cf-api.sh dns-list` into the runbook.
   2. Remove both custom domains from the Pages project.
   3. Delete the two CNAME records explicitly (Pages does not delete them) and verify with a DNS list query that no A, AAAA or CNAME record remains for either hostname.
   4. Add both hostnames as Worker Custom Domains on `simongreer-site`. Cloudflare creates the DNS records and issues certificates.
   5. Poll until both custom domains report `active` and `curl -sI https://simongreer.co.uk/ https://www.simongreer.co.uk/` return 200 with a valid certificate, with a 10-minute timeout. On timeout, execute the rollback in step 6.
   Expected downtime is well under a minute, but the acceptance gate is step 5, not the elapsed time.
4. Apply the zone changes in section 9. Add the production hostname to the Turnstile widget if not already present.
5. Verify `https://simongreer.co.uk/` and `https://www.simongreer.co.uk/` serve the new site, submit the contact form once, check Workers Logs and Web Analytics.
6. **Rollback** (any time in the first week): remove the two Worker Custom Domains and verify their DNS records are gone; recreate the recorded CNAMEs to `simongreer.pages.dev` (proxied); re-add both custom domains to the Pages project (its last production deployment is retained) and wait for `active`; verify both hostnames return 200 from Pages; revert the zone changes. Rehearse steps 3 and 6 once on a throwaway hostname (for example `rehearsal.simongreer.co.uk` attached to a scratch Pages project) before the real transfer, recording DNS, domain activation and HTTPS results in both directions in the runbook.
7. Merge `rebuild/astro7` into `main` by PR (the diff is effectively a tree replacement). Switch Workers Builds' production branch to `main`. Enable branch protection.
8. After one stable week: delete the Pages project `simongreer`, branch `production`, the `simongreer-bench` Pages project if it exists, the stale `my-astro-app` Worker, and the `simongreercouk` GitHub environment.

## 12. Error handling

- Build: schema violations, missing images, dangling references, route-manifest mismatches and unmatched `hireme_filter` values fail the build or `test`.
- Runtime: the Worker handles the Action, image endpoint and 404 only. Action errors are structured (section 7). Image binding failures fall back to serving the original asset. `404.astro` is served for unmatched paths.
- Email: `EMAIL.send()` rejection is logged and surfaced as `INTERNAL_SERVER_ERROR` with the mailto fallback message.
- Client scripts are guarded so a failure in one enhancement (TOC, filter, lightbox) leaves the page usable.

## 13. Risks and mitigations

- Cloudflare Email Service is beta. `sendContactEmail()` is the single seam; a Mailtrap implementation can be swapped in behind an env var if delivery is unreliable.
- Adapter v15 and the `cf` CLI are unreleased. Stay on adapter 14 and `wrangler.jsonc`; migrate later in isolation.
- Cross-document view transitions have ~88% support; unsupported browsers get ordinary navigation.
- Rate limiting is per-location and approximate; Turnstile is the primary bot control.
- Visual fidelity drift: snapshot review by Simon (criterion 4 and 4.5) before cutover.
- Vendor icons missing from Simple Icons: custom SVGs in `src/icons/`.

## 14. Implementation phases (for the plan)

0. Spike: pinned Astro 7 + adapter 14 scaffold that builds, passes `wrangler deploy --dry-run`, executes a trivial Action under `wrangler dev` with `env` from `cloudflare:workers`, and produces a version preview URL from CI. Generate `route-manifest.json` from `main`.
1. Tooling, tokens, base layout, header, footer, theme toggle.
2. Content migration per 4.1, 4.2 and 4.5; `getPublished`; blog index and post; RSS; sitemap; SEO; OG images.
3. Home hero and card grid, tag filter, tech index and pages, projects.
4. Services collection and `hire-me/[service]`, panels, tech tiles, lightbox, gallery, carousel.
5. Contact action, email, Turnstile, rate limit; forms on service pages, get-in-touch and me/professionally.
6. Search, headers, CSP, all test suites, Lighthouse, Workers Builds, CI workflow.
7. Cutover per 11.4 and cleanup.
