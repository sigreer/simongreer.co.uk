# Rebuild Phase 0–1: Scaffold, Tooling, CI Preview Pipeline and Site Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superstar:subagent-driven-development (recommended) or superstar:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a deployable Astro 7 skeleton on Cloudflare Workers with the design-token system, base layout, header, footer and theme toggle, plus the route manifest and a CI pipeline that publishes a per-commit preview URL.

**Architecture:** A fresh Astro 7 project on branch `rebuild/astro7` (git worktree) replaces the old tree. All pages are prerendered static assets served by Workers Static Assets; the Worker only serves Actions, the image endpoint and 404. Styling is vanilla CSS in cascade layers with OKLCH tokens and `light-dark()`. No client framework. CI runs checks and tests, builds, uploads a tagged Worker version and reports its preview URL.

**Tech Stack:** Astro 7.3+, `@astrojs/cloudflare` 14.3+, Wrangler 4, Bun 1.4, Biome 2, Knip 6, Vitest 5, Playwright 1.63, astro-icon + Iconify (material-symbols, simple-icons), GitHub Actions.

**Spec:** `docs/specs/2026-09-28-site-rebuild-design.md` (phases 0 and 1 of §14). Later phases (content routes, hire-me, contact form, search/CSP/cutover) get their own plans once this skeleton exists.

**Conventions used throughout this plan**

- Repo root on the worktree is referred to as `$WT`. Set it once per shell: `export WT=/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7`.
- Every command runs from `$WT` unless stated.
- Commit after every task with the message shown. Do not squash.
- "Expected:" lines show the essential output; extra lines are fine.
- Shell snippets that pipe into `tail`/`grep` assume `set -o pipefail` (zsh: `setopt pipefail`) so a failing command is not masked by the filter. Set it once per shell before starting.

---

## File structure created by this plan

| Path | Responsibility |
|---|---|
| `scripts/gen-route-manifest.mjs` | Reads old `src/content` frontmatter and writes `docs/specs/route-manifest.json` |
| `docs/specs/route-manifest.json` | Old path → new path → action, consumed by tests in Phase 2 |
| `package.json`, `.bun-version`, `tsconfig.json`, `.gitignore`, `.dev.vars.example` | Project metadata and toolchain pins |
| `src/content.config.ts` | Created empty in Task 2 (replaces legacy `src/content/config.ts`), filled with `services` in Task 8 |
| `src/assets/fonts/*.woff2` | Geist fonts consumed by the Fonts API (moved from `public/fonts`) |
| `astro.config.ts` | Astro config: adapter, fonts, integrations, `session: false` |
| `wrangler.jsonc` | Worker name, assets, bindings, vars, observability |
| `biome.json`, `knip.json`, `vitest.config.ts`, `playwright.config.ts` | Quality tooling |
| `src/env.d.ts` | Types for `cloudflare:workers` env |
| `src/actions/index.ts` | `ping` spike action (replaced by `contact` in Phase 5) |
| `src/styles/{reset,tokens,base,layout,utilities}.css` | Design system |
| `src/layouts/Base.astro` | HTML shell, head, layers, header/footer |
| `src/components/{Seo,Header,Nav,ThemeToggle,Footer}.astro` | Shell components |
| `src/lib/site.ts` | Site constants (name, socials, nav items) |
| `src/content/services.json` | `services` collection data (nav needs it; sections filled in Phase 4) |
| `src/pages/index.astro`, `src/pages/404.astro`, `src/pages/spike.astro` | Placeholder home, 404, spike page (spike removed in Phase 5) |
| `public/_headers`, `public/_redirects` | Static headers and redirects |
| `tests/unit/site.test.ts`, `tests/e2e/shell.spec.ts`, `tests/e2e/spike.spec.ts` | Tests |
| `.github/workflows/ci.yml` | CI + preview version upload |
| `docs/runbooks/workers-builds-setup.md` | Manual Cloudflare dashboard steps recorded as a runbook |

---

### Task 0: Worktree, branch and toolchain

**Files:**
- Create: worktree at `/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7`

- [x] **Step 1: Commit the planning documents on `main`** (they are currently untracked, so a worktree from `main` would not contain them)

```bash
cd /home/simon/Dev/sigreer/simongreer.co.uk/simongreer.co.uk
git add docs/audit docs/specs docs/plans docs/reviewer docs/handoffs
git commit -m "docs: codebase audit, rebuild design spec, phase 0-1 plan and review chains"
git push origin main
```
Expected: one commit containing `docs/specs/2026-09-28-site-rebuild-design.md` and this plan. The pre-existing uncommitted change to `scripts/icon-helper.sh` is left alone (it belongs to the old tree and is deleted in Task 2).

- [x] **Step 2: Create the branch and worktree from local `main`**

```bash
git worktree add -b rebuild/astro7 ../rebuild-astro7 main
export WT=/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7
cd $WT && git status --short | head && ls docs/specs docs/plans
```
Expected: `Preparing worktree (new branch 'rebuild/astro7')`, an empty status, and both the spec and this plan listed.

- [x] **Step 3: Upgrade Bun and record the version**

```bash
bun upgrade
bun --version
```
Expected: a version `1.4.x` or later. Record it; it is used in Task 2 and Task 12 as `<BUN_VERSION>`.

- [x] **Step 4: Confirm Node meets Astro 7's requirement**

```bash
node --version
```
Expected: `v22.12.0` or newer (local machine has v26).

No commit for this task.

---

### Task 1: Route manifest generator (runs against the OLD tree before anything is deleted)

**Files:**
- Create: `scripts/gen-route-manifest.mjs`
- Create: `docs/specs/route-manifest.json` (generated)

- [x] **Step 1: Write the generator**

```js
// scripts/gen-route-manifest.mjs
// Reads the OLD content tree (Astro 5 layout) and emits docs/specs/route-manifest.json.
// Run once from the repo root while src/content still holds the legacy frontmatter.
// MANIFEST_OUT overrides the output path; REVERSE_ORDER=1 enumerates files backwards (self-check).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outFile = process.env.MANIFEST_OUT || 'docs/specs/route-manifest.json';
const collections = [
  { name: 'blog', dir: 'src/content/blog', prefix: '/blog/' },
  { name: 'tech', dir: 'src/content/tech', prefix: '/tech/' },
  { name: 'projects', dir: 'src/content/projects', prefix: '/tech/projects/' },
];

function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter in ${file}`);
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return out;
}

// Pass 1: collect entries with their legacy path and desired new id.
const entries = [];
for (const c of collections) {
  const files = readdirSync(join(root, c.dir)).filter((n) => /\.mdx?$/.test(n));
  if (process.env.REVERSE_ORDER) files.reverse(); // used by the self-check to prove order independence
  for (const f of files) {
    const file = join(c.dir, f);
    const fm = frontmatter(join(root, file));
    const filename = f.replace(/\.mdx?$/, '');
    const slug = fm.slug || filename; // Astro 5 glob loader used slug as id when present
    entries.push({ c, file, filename, slug, status: fm.status || 'published', title: fm.title || '', currentPath: `${c.prefix}${slug}/` });
  }
}

const rows = [];
const live = entries.filter((e) => {
  if (e.status !== 'published') { rows.push(row(e, null, 'drop', `status ${e.status}`)); return false; }
  if (e.title === 'Project Title') { rows.push(row(e, null, 'drop', 'placeholder entry')); return false; }
  return true;
});

// Pass 2: desired new id per entry, then resolve collisions deterministically.
for (const e of live) {
  e.newId = e.slug.endsWith('.mdx') ? e.slug.replace(/\.mdx$/, '') : e.slug;
}
const byTarget = new Map();
for (const e of live) {
  const key = `${e.c.prefix}${e.newId}/`;
  byTarget.set(key, [...(byTarget.get(key) || []), e]);
}
for (const [target, group] of byTarget) {
  if (group.length === 1) continue;
  // Rule: the entry whose filename equals the contested id owns it; every other entry falls back to its filename.
  const owners = group.filter((e) => e.filename === e.newId);
  if (owners.length !== 1) throw new Error(`unresolvable collision for ${target}: ${group.map((g) => g.file).join(', ')}`);
  for (const e of group) if (e !== owners[0]) { e.newId = e.filename; e.collidedWith = owners[0].file; }
}

for (const e of live) {
  const newPath = `${e.c.prefix}${e.newId}/`;
  if (e.collidedWith) rows.push(row(e, newPath, 'keep', `slug collided with ${e.collidedWith}; uses filename ${e.filename} (new path, no redirect)`));
  else if (e.slug.endsWith('.mdx')) rows.push(row(e, newPath, 'redirect', 'slug contained .mdx'));
  else if (e.slug !== e.filename) rows.push(row(e, newPath, 'keep', `rename file ${e.filename}.mdx -> ${e.slug}.mdx`));
  else rows.push(row(e, newPath, 'keep', 'unchanged'));
}

function row(e, newPath, action, reason) {
  return { collection: e.c.name, file: e.file, currentPath: e.currentPath, newPath, action, reason };
}

// Static aliases and service pages
rows.push({ collection: 'static', file: null, currentPath: '/me/', newPath: '/me/personally/', action: 'redirect', reason: 'existing rule' });
rows.push({ collection: 'static', file: null, currentPath: '/me/get-in-touch/', newPath: '/get-in-touch/', action: 'redirect', reason: 'replaces meta-refresh page' });
rows.push({ collection: 'static', file: null, currentPath: '/home/', newPath: null, action: 'drop', reason: 'orphan duplicate of /' });
for (const [oldPage, target] of [
  ['vpn-setup-routing-wireguard-ipsec-openvpn', 'networking-and-security'],
  ['system-administration', 'system-design-and-deployment'],
]) rows.push({ collection: 'services', file: null, currentPath: `/hire-me/${oldPage}/`, newPath: `/hire-me/${target}/`, action: 'redirect', reason: 'page merged (spec §4.3)' });
for (const p of ['web-development','business-apps','cloud-and-hosted','networking-and-security','storage-and-nas','software-development','data-and-databases','system-design-and-deployment'])
  rows.push({ collection: 'services', file: null, currentPath: `/hire-me/${p}/`, newPath: `/hire-me/${p}/`, action: 'keep', reason: 'service page' });
rows.push({ collection: 'services', file: null, currentPath: null, newPath: '/hire-me/ai-and-automation/', action: 'keep', reason: 'new service page (spec §4.3)' });

// Self-checks
const kept = rows.filter((r) => r.action === 'keep').map((r) => r.newPath);
if (new Set(kept).size !== kept.length) throw new Error('duplicate kept destination paths');
const find = (file) => rows.find((r) => r.file === file);
if (find('src/content/tech/langchain.mdx')?.newPath !== '/tech/langchain/') throw new Error('langchain must own /tech/langchain/');
if (find('src/content/tech/flowise.mdx')?.newPath !== '/tech/flowise/') throw new Error('flowise must move to /tech/flowise/');

rows.sort((a, b) => `${a.collection}${a.currentPath}${a.file}`.localeCompare(`${b.collection}${b.currentPath}${b.file}`));
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2) + '\n');
const counts = rows.reduce((acc, r) => ((acc[r.action] = (acc[r.action] || 0) + 1), acc), {});
console.log(JSON.stringify(counts));
```

- [x] **Step 2: Run it in both enumeration orders and confirm identical output**

```bash
cd $WT && mkdir -p docs/specs
node scripts/gen-route-manifest.mjs
MANIFEST_OUT=/tmp/manifest-reversed.json REVERSE_ORDER=1 node scripts/gen-route-manifest.mjs
diff <(jq -S 'del(.generatedAt)' docs/specs/route-manifest.json) <(jq -S 'del(.generatedAt)' /tmp/manifest-reversed.json) && echo ORDER-INDEPENDENT
jq -r '.rows[] | select(.action!="keep" or (.reason!="unchanged" and .reason!="service page")) | "\(.action)\t\(.currentPath) -> \(.newPath) | \(.reason)"' docs/specs/route-manifest.json
```
Expected: both runs print exactly `{"drop":7,"keep":80,"redirect":5}`, then `ORDER-INDEPENDENT`, then 19 notable rows including:
```
keep	/blog/funky-square-dance-icon-set-svg/ -> /blog/funky-square-dance-icon-set-svg/ | rename file funkysquaredance-icon-set.mdx -> funky-square-dance-icon-set-svg.mdx
keep	/tech/langchain/ -> /tech/flowise/ | slug collided with src/content/tech/langchain.mdx; uses filename flowise (new path, no redirect)
redirect	/tech/projects/voip-with-all-of-the-features-and-none-of-the-cost.mdx/ -> /tech/projects/voip-with-all-of-the-features-and-none-of-the-cost/ | slug contained .mdx
redirect	/hire-me/system-administration/ -> /hire-me/system-design-and-deployment/ | page merged (spec §4.3)
drop	/tech/projects/another-project/ -> null | placeholder entry
```
The script's own self-checks throw if kept destinations are not unique, if `langchain.mdx` does not own `/tech/langchain/`, or if `flowise.mdx` does not land on `/tech/flowise/`. A thrown error means the content differs from what the audit recorded; investigate before continuing.

- [x] **Step 3: Commit**

```bash
git add scripts/gen-route-manifest.mjs docs/specs/route-manifest.json
git commit -m "chore(rebuild): generate route manifest from legacy content"
```

---

### Task 2: Wipe the old tree and scaffold Astro 7

**Files:**
- Delete: everything except `src/content`, `src/images`, `public/fonts`, `public/images`, `docs/`, `scripts/gen-route-manifest.mjs`, `.git`
- Create: `package.json`, `.bun-version`, `tsconfig.json`, `.gitignore`, `.dev.vars.example`, `astro.config.ts`, `wrangler.jsonc`, `src/env.d.ts`, `src/pages/index.astro`

- [x] **Step 1: Remove the legacy tree**

```bash
cd $WT
git rm -rq --cached . 
find . -mindepth 1 -maxdepth 1 ! -name .git ! -name docs ! -name src ! -name public ! -name scripts -exec rm -rf {} +
find src -mindepth 1 -maxdepth 1 ! -name content ! -name images -exec rm -rf {} +
rm -f src/content/config.ts   # legacy location; Astro 6+ raises LegacyContentConfigError if it remains
find public -mindepth 1 -maxdepth 1 ! -name fonts ! -name images -exec rm -rf {} +
find scripts -mindepth 1 ! -name gen-route-manifest.mjs -exec rm -rf {} +
ls
```
Expected: `docs  public  scripts  src`.

- [x] **Step 2: Write `package.json`** (replace `<BUN_VERSION>` with the value from Task 0)

```json
{
  "name": "simongreer-site",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "packageManager": "bun@<BUN_VERSION>",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro build && pagefind --site dist",
    "preview": "wrangler dev --port 8787",
    "check": "wrangler types && astro check && biome check . && knip",
    "format": "biome check --write .",
    "test:unit": "vitest run tests/unit --exclude tests/unit/routes.test.ts",
    "test:routes": "vitest run tests/unit/routes.test.ts --passWithNoTests",
    "test": "bun run test:unit && bun run build && bun run test:routes",
    "test:e2e": "playwright test",
    "lighthouse": "lhci autorun"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^14.3.3",
    "@astrojs/mdx": "^8.0.2",
    "@astrojs/rss": "^4.0.15",
    "@astrojs/sitemap": "^3.7.0",
    "astro": "^7.3.5",
    "astro-expressive-code": "^0.44.2",
    "astro-icon": "^1.1.5",
    "@iconify-json/material-symbols": "^1.2.0",
    "@iconify-json/simple-icons": "^1.2.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.6",
    "@biomejs/biome": "2.5.14",
    "@lhci/cli": "^0.15.1",
    "@playwright/test": "^1.63.0",
    "knip": "^6.38.0",
    "pagefind": "^1.5.2",
    "typescript": "^5.9.3",
    "vitest": "^5.0.2",
    "wrangler": "^4.143.0"
  }
}
```

- [x] **Step 3: Write the small config files**

`.bun-version`:
```
<BUN_VERSION>
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@lib/*": ["src/lib/*"],
      "@styles/*": ["src/styles/*"],
      "@images/*": ["src/images/*"]
    },
    "types": ["./worker-configuration.d.ts"]
  },
  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "astro.config.ts", "vitest.config.ts", "playwright.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.wrangler/
worker-configuration.d.ts
.dev.vars
.env
.env.*
!.dev.vars.example
test-results/
playwright-report/
tests/e2e/__snapshots__/**/*-actual.png
.lighthouseci/
```

`.dev.vars.example`:
```
# Copy to .dev.vars for local development. Never commit .dev.vars.
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

- [x] **Step 4: Write `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "simongreer-site",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-09-28",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page"
  },
  "observability": { "enabled": true },
  "placement": { "mode": "smart" },
  "preview_urls": true,
  "vars": {
    "SITE_URL": "https://simongreer.co.uk",
    "TURNSTILE_SITE_KEY": "1x00000000000000000000AA",
    "CONTACT_TO_EMAIL": "simon@simongreer.co.uk",
    "CONTACT_FROM_EMAIL": "website@simongreer.co.uk"
  },
  // Bindings below are declared now so `wrangler types` generates their types.
  // The contact Action that uses them is Phase 5. The `send_email` binding is
  // added in Phase 5 too, after the destination address is verified in the
  // dashboard, so that no deploy depends on an unverified address.
  "ratelimits": [{ "name": "CONTACT_RATE_LIMIT", "namespace_id": "1001", "simple": { "limit": 3, "period": 60 } }],
  "images": { "binding": "IMAGES" }
}
```
Note: `TURNSTILE_SITE_KEY` is the documented always-pass test key until Phase 5 creates the real widget. `CONTACT_*` addresses are placeholders to be confirmed with Simon in Phase 5.

- [x] **Step 5: Write `astro.config.ts`**

```ts
import { defineConfig, envField, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import astroExpressiveCode from 'astro-expressive-code';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://simongreer.co.uk',
  output: 'static',
  session: false,
  prefetch: false,
  adapter: cloudflare({
    imageService: { build: 'compile', runtime: 'cloudflare-binding' },
  }),
  integrations: [
    astroExpressiveCode({ themes: ['github-dark', 'github-light'] }),
    mdx(),
    sitemap(),
    icon({
      include: {
        'material-symbols': ['newspaper-outline', 'work-outline', 'account-circle-outline', 'menu-rounded', 'close-rounded', 'light-mode-outline', 'dark-mode-outline', 'chevron-right-rounded'],
        'simple-icons': ['github', 'bluesky', 'astro', 'cloudflare', 'bun', 'typescript'],
      },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist Sans',
      cssVariable: '--font-sans',
      options: { variants: [{ weight: '100 900', style: 'normal', src: ['./public/fonts/Geist[wght].woff2'] }] },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      options: { variants: [{ weight: '100 900', style: 'normal', src: ['./public/fonts/GeistMono[wght].woff2'] }] },
    },
  ],
  env: {
    schema: {
      SITE_URL: envField.string({ context: 'client', access: 'public', default: 'https://simongreer.co.uk' }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
    },
  },
  image: { formats: ['avif', 'webp'] },
  build: { assets: '_astro' },
});
```
The Fonts API copies the woff2 files into `dist/_astro/fonts/` with hashed names, so after this task `public/fonts` is moved to `src/assets/fonts` in Step 7 to avoid shipping duplicates.

- [x] **Step 6: Write `src/env.d.ts` and a placeholder page**

`src/env.d.ts`:
```ts
/// <reference types="astro/client" />
// Bindings and vars are typed by `wrangler types` into worker-configuration.d.ts (Env interface).
// `import { env } from 'cloudflare:workers'` is typed by @cloudflare/workers-types via wrangler.
```

`src/content.config.ts` (empty for now; Task 8 adds the `services` collection):
```ts
export const collections = {};
```

`src/pages/index.astro`:
```astro
---
const title = 'SimonGreer.co.uk';
---
<!doctype html>
<html lang="en-GB">
  <head><meta charset="utf-8" /><title>{title}</title></head>
  <body><h1>{title}</h1></body>
</html>
```

- [x] **Step 7: Move fonts into `src/assets/fonts` and fix the config paths**

```bash
mkdir -p src/assets/fonts && git mv public/fonts/*.woff2 src/assets/fonts/ 2>/dev/null || mv public/fonts/*.woff2 src/assets/fonts/
rmdir public/fonts
sed -i "s#./public/fonts/#./src/assets/fonts/#g" astro.config.ts
grep -n "assets/fonts" astro.config.ts
```
Expected: two lines showing `./src/assets/fonts/Geist[wght].woff2` and `./src/assets/fonts/GeistMono[wght].woff2`.

- [x] **Step 8: Install, type-check and build (in that order, as CI will)**

Biome and Knip are configured in Task 4, so only the type-generation and Astro check run here; the full `bun run check` is first exercised in Task 4 step 7.

```bash
bun install
bunx wrangler types && bunx astro check 2>&1 | tail -8
bun run build 2>&1 | tail -20
```
Expected: `wrangler types` writes `worker-configuration.d.ts`, `astro check` reports 0 errors, then Astro prints `[build] Complete!`; Pagefind prints `Indexed 1 page` (or 0 pages, acceptable until content exists). No errors. If `astro build` complains that `session` is unknown, the installed Astro is older than 7.2: run `bun update astro` and retry.

- [x] **Step 9: Verify the Worker config is valid without deploying**

```bash
bunx wrangler deploy --dry-run --outdir /tmp/wr-dry 2>&1 | tail -15
```
Expected: `--dry-run: exiting now.` after a bindings summary that lists `env.ASSETS`, `env.CONTACT_RATE_LIMIT`, `env.IMAGES` and the four vars. No `✘` lines.

- [x] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(rebuild): scaffold Astro 7 on Cloudflare Workers with static assets"
```

---

### Task 3: Spike — an Action reading `env` under the real Worker runtime

**Files:**
- Create: `src/actions/index.ts`, `src/pages/spike.astro` (deleted in Phase 5), `playwright.config.ts`, `tests/e2e/spike.spec.ts`

- [x] **Step 1: Write the Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  use: { baseURL: 'http://127.0.0.1:8787', trace: 'retain-on-failure' },
  webServer: {
    command: 'bun run preview',
    url: 'http://127.0.0.1:8787/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
```

- [x] **Step 2: Write the failing e2e test**

`tests/e2e/spike.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('ping action runs in the Worker and reads a binding var', async ({ page }) => {
  await page.goto('/spike/');
  await page.getByRole('button', { name: 'Ping' }).click();
  await expect(page.locator('#out')).toHaveText('pong from https://simongreer.co.uk', { timeout: 10_000 });
});
```

- [x] **Step 3: Run it to see it fail**

```bash
bunx playwright install chromium
bun run build && bunx playwright test tests/e2e/spike.spec.ts --project=desktop 2>&1 | tail -8
```
Expected: `1 failed` with a 404 on `/spike/`.

- [x] **Step 4: Write the action and the page**

`src/actions/index.ts`:
```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';

export const server = {
  // Phase 0 spike. Replaced by `contact` in Phase 5.
  ping: defineAction({
    input: z.object({ who: z.string().min(1) }),
    handler: async ({ who }) => {
      return { reply: `pong from ${env.SITE_URL}`, who };
    },
  }),
};
```

`src/pages/spike.astro` (a real route on purpose; Astro ignores `_`-prefixed files, and this page must be reachable under `wrangler dev`; Phase 5 deletes it):
```astro
---
const title = 'Spike';
---
<!doctype html>
<html lang="en-GB">
  <head><meta charset="utf-8" /><title>{title}</title></head>
  <body>
    <button id="ping">Ping</button>
    <output id="out"></output>
    <script>
      import { actions } from 'astro:actions';
      document.getElementById('ping')!.addEventListener('click', async () => {
        const { data, error } = await actions.ping({ who: 'spike' });
        document.getElementById('out')!.textContent = error ? `error: ${error.message}` : data.reply;
      });
    </script>
  </body>
</html>
```
- [x] **Step 5: Build and run the test**

```bash
bun run build && bunx playwright test tests/e2e/spike.spec.ts --project=desktop 2>&1 | tail -5
```
Expected: `1 passed`. This proves: Actions work with `output: 'static'`, `env` from `cloudflare:workers` resolves under `wrangler dev`, and the Worker serves `/_actions/ping` while `/spike/` is a static asset.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(rebuild): spike Action under workerd reading cloudflare:workers env"
```

---

### Task 4: Biome, Knip, Vitest and the `check` script

**Files:**
- Create: `biome.json`, `knip.json`, `vitest.config.ts`, `tests/unit/site.test.ts`, `src/lib/site.ts`

- [x] **Step 1: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.14/schema.json",
  "files": { "includes": ["**", "!dist", "!node_modules", "!.astro", "!.wrangler", "!worker-configuration.d.ts", "!docs/**"] },
  "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 110 },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "css": { "formatter": { "enabled": true }, "linter": { "enabled": true } },
  "html": { "formatter": { "enabled": true } },
  "overrides": [
    {
      "includes": ["**/*.astro"],
      "linter": {
        "rules": {
          "style": { "useConst": "off", "useImportType": "off" },
          "correctness": { "noUnusedVariables": "off", "noUnusedImports": "off" }
        }
      }
    }
  ]
}
```

- [x] **Step 2: Write `knip.json`**

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["scripts/gen-route-manifest.mjs", "tests/**/*.ts", "playwright.config.ts", "vitest.config.ts"],
  "ignoreDependencies": ["@lhci/cli", "pagefind", "@iconify-json/material-symbols", "@iconify-json/simple-icons"],
  "ignoreBinaries": ["wrangler", "lhci", "pagefind"]
}
```
The Astro plugin auto-detects `src/pages/**`, `src/content.config.ts` and `src/actions/index.ts`. Iconify sets are loaded by name at build time, so Knip cannot see them; they are ignored explicitly.

- [x] **Step 3: Write `vitest.config.ts`**

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [x] **Step 4: Write the failing unit test for site constants**

`tests/unit/site.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, SITE } from '../../src/lib/site';

describe('site constants', () => {
  it('has the production URL without trailing slash', () => {
    expect(SITE.url).toBe('https://simongreer.co.uk');
  });
  it('nav items have absolute paths and labels', () => {
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(3);
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith('/')).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.startsWith('material-symbols:')).toBe(true);
    }
  });
});
```

- [x] **Step 5: Run to see it fail**

```bash
bun run test:unit 2>&1 | tail -5
```
Expected: FAIL, `Cannot find module '../../src/lib/site'`.

- [x] **Step 6: Write `src/lib/site.ts`**

```ts
export const SITE = {
  name: 'SimonGreer.co.uk',
  url: 'https://simongreer.co.uk',
  defaultDescription: 'Simon Greer: blog posts and notes on self-hosting, Linux, networking, web development and the tools behind them.',
  author: 'Simon Greer',
  socials: [
    { label: 'GitHub', href: 'https://github.com/sigreer', icon: 'simple-icons:github' },
    { label: 'Bluesky', href: 'https://bsky.app/profile/simongreer.co.uk', icon: 'simple-icons:bluesky' },
  ],
  repo: 'https://github.com/sigreer/simongreer.co.uk',
} as const;

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Path prefix used for active-state matching. */
  root: string;
  /** When true, Nav renders the services dropdown under this item. */
  hasServicesMenu?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Blog Posts', href: '/blog/', icon: 'material-symbols:newspaper-outline', root: '/blog' },
  { label: 'Hire Me', href: '/hire-me/', icon: 'material-symbols:work-outline', root: '/hire-me', hasServicesMenu: true },
  { label: 'About Me', href: '/me/personally/', icon: 'material-symbols:account-circle-outline', root: '/me' },
] as const;
```
The Bluesky handle must be confirmed against the current live pre-header link (`git show main:src/components/Header/PreHeader.astro | grep -o 'https://bsky[^"]*'`) and corrected if different.

- [x] **Step 7: Run unit tests and the full check**

```bash
bun run test:unit 2>&1 | tail -5
bun run check 2>&1 | tail -15
```
Expected: `2 passed`; `wrangler types` regenerates `worker-configuration.d.ts`, `astro check` reports 0 errors; Biome `Checked N files. No fixes applied.`; Knip prints nothing (exit 0). If Biome reports formatting diffs, run `bun run format` and re-run. If Knip flags `src/pages/spike.astro` or the `ping` action, that is expected to be temporary; do not ignore it, it is removed in Phase 5. If Knip flags anything else, fix it.

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(rebuild): add Biome, Knip, Vitest and site constants"
```

---

### Task 5: Design tokens and CSS layers

**Files:**
- Create: `src/styles/reset.css`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/layout.css`, `src/styles/utilities.css`

Colour values are converted from the audit's HSL values (spec source §1.6). Verify each OKLCH visually in the browser against the live site during Task 11; they are starting points, not sacred.

- [x] **Step 1: `tokens.css`**

```css
@layer tokens {
  :root {
    color-scheme: light dark;

    /* Brand */
    --color-pink: oklch(58% 0.22 356);      /* ≈ #DA2676, hsl(333 71% 50%) */
    --color-purple: oklch(66% 0.2 318);     /* ≈ #C95BE6, hsl(288 70% 62%) */
    --color-blue: oklch(38% 0.16 268);      /* ≈ #1D3A8A / tailwind blue-900 */
    --color-blue-deep: oklch(30% 0.14 268); /* tailwind blue-950, hero gradient end */
    --color-logo-pink: oklch(72% 0.26 340); /* #ff63d5 */
    --color-logo-purple: oklch(32% 0.22 295); /* #4200a0 */

    /* Semantic, light-dark pairs */
    --color-bg-page: light-dark(oklch(97% 0 0), oklch(20% 0 0));         /* gray-100 / 8% grey */
    --color-surface: light-dark(oklch(100% 0 0), oklch(20% 0 0));
    --color-surface-raised: light-dark(oklch(100% 0 0), oklch(24% 0 0));
    --color-text: light-dark(oklch(20% 0 0), oklch(98% 0 0));
    --color-text-muted: light-dark(oklch(48% 0 0), oklch(72% 0 0));
    --color-heading-accent: light-dark(oklch(35% 0 0), var(--color-purple));
    --color-border: light-dark(oklch(88% 0 0), oklch(30% 0 0));           /* #dcdde0 / neutral-800 */
    --color-border-strong: light-dark(oklch(66% 0 0), oklch(36% 0 0));    /* #9b9b9b */
    --color-band: light-dark(var(--color-blue), oklch(20% 0 0));          /* pre-header + footer block */
    --color-band-text: oklch(100% 0 0);
    --color-link: light-dark(oklch(48% 0.2 262), oklch(75% 0.12 262));    /* blue-700 */
    --color-link-hover: var(--color-pink);
    --color-nav-active: oklch(50% 0.21 356);                              /* pink-700 */
    --color-nav-hover-bg: light-dark(oklch(90% 0.06 318), oklch(30% 0 0)); /* purple-200 */
    --color-focus: var(--color-purple);

    /* Type: fluid steps reproducing 16px → 18px @1024 → 19px @1280 root scaling */
    --font-size-root: clamp(1rem, 0.85rem + 0.25vw, 1.1875rem);
    --step--1: 0.875em;
    --step-0: 1em;
    --step-1: 1.125em;
    --step-2: 1.25em;
    --step-3: 1.5em;
    --step-4: 1.875em;
    --leading-tight: 1.2;
    --leading-body: 1.5;

    /* Space (rem so it scales with root) */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.5rem;
    --space-6: 2rem;
    --space-7: 2.5rem;
    --space-8: 3rem;
    --space-9: 4rem;
    --space-10: 6rem;

    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-full: 9999px;

    --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.08);
    --shadow-md: 0 4px 10px oklch(0% 0 0 / 0.12);
    --shadow-lg: 0 10px 25px oklch(0% 0 0 / 0.18);

    --container: 1360px;
    --header-height: 4rem;
    --preheader-height: 2.5rem;

    --motion-fast: 150ms;
    --motion-base: 300ms;
    --ease: cubic-bezier(0.2, 0, 0, 1);
  }

  :root[data-theme='light'] { color-scheme: light; }
  :root[data-theme='dark'] { color-scheme: dark; }
}
```

- [x] **Step 2: `reset.css`**

```css
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; }
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  body { min-height: 100dvh; line-height: var(--leading-body); -webkit-font-smoothing: antialiased; }
  img, picture, video, canvas, svg { display: block; max-width: 100%; }
  input, button, textarea, select { font: inherit; color: inherit; }
  button { background: none; border: 0; padding: 0; cursor: pointer; }
  p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
  ul[role='list'], ol[role='list'] { list-style: none; padding: 0; }
  a { color: inherit; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
}
```

- [x] **Step 3: `base.css`**

```css
@layer base {
  html {
    font-size: var(--font-size-root);
    font-family: var(--font-sans);
    background: var(--color-bg-page);
    color: var(--color-text);
    scroll-behavior: smooth;
  }
  @view-transition { navigation: auto; }
  ::view-transition-old(root), ::view-transition-new(root) { animation-duration: 200ms; }

  h1, h2, h3, h4 { line-height: var(--leading-tight); font-weight: 600; }
  h1 { font-size: var(--step-4); }
  h2 { font-size: var(--step-3); }
  h3 { font-size: var(--step-2); }
  h4 { font-size: var(--step-1); }

  a { color: var(--color-link); text-decoration: none; font-weight: 600; }
  a:hover { color: var(--color-link-hover); text-decoration: underline; }
  :focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius: var(--radius-sm); }

  code, kbd, pre { font-family: var(--font-mono); }
  ::selection { background: var(--color-pink); color: white; }
}
```

- [x] **Step 4: `layout.css`**

```css
@layer layout {
  .container {
    width: min(100% - 2 * var(--space-5), var(--container));
    margin-inline: auto;
  }
  @media (min-width: 48rem) { .container { padding-block: var(--space-5); } }

  .stack { display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-4)); }
  .cluster { display: flex; flex-wrap: wrap; gap: var(--cluster-gap, var(--space-3)); align-items: center; }

  .grid-auto {
    display: grid;
    gap: var(--grid-gap, var(--space-5));
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--grid-min, 16rem)), 1fr));
  }

  /* 3/7 panel split that stacks under 48rem (used by hire-me and me/professionally in later phases) */
  .split { display: grid; gap: var(--space-5); grid-template-columns: 1fr; }
  @media (min-width: 48rem) { .split { grid-template-columns: 3fr 7fr; } }
}
```

- [x] **Step 5: `utilities.css`**

```css
@layer utilities {
  .visually-hidden {
    position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
  .uppercase-label { font-size: var(--step-1); font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; color: var(--color-heading-accent); }
  .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .line-clamp-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
  .prose-icon { display: inline-block; vertical-align: -0.15em; inline-size: 1em; block-size: 1em; }
}
```

- [x] **Step 6: Lint the CSS**

```bash
bunx biome check src/styles 2>&1 | tail -5
```
Expected: `Checked 5 files. No fixes applied.` (run `bun run format` if only formatting differs).

- [x] **Step 7: Commit**

```bash
git add src/styles
git commit -m "feat(rebuild): add vanilla CSS design system with OKLCH tokens and cascade layers"
```

---

### Task 6: `Seo.astro` and `Base.astro` layout

**Files:**
- Create: `src/components/Seo.astro`, `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`

- [x] **Step 1: `src/components/Seo.astro`**

```astro
---
import { SITE } from '@lib/site';

interface Props {
  title: string;
  description?: string;
  /** Absolute or site-relative URL of the OG image. Defaults to the site-wide image (added in Phase 2). */
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: Date;
}

const { title, description = SITE.defaultDescription, image, type = 'website', publishedTime } = Astro.props;
const canonical = new URL(Astro.url.pathname, SITE.url).href;
const fullTitle = title === SITE.name ? title : `${title} · ${SITE.name}`;
const ogImage = image ? new URL(image, SITE.url).href : undefined;
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:type" content={type} />
<meta property="og:site_name" content={SITE.name} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
{ogImage && <meta property="og:image" content={ogImage} />}
{publishedTime && <meta property="article:published_time" content={publishedTime.toISOString()} />}
<meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
{ogImage && <meta name="twitter:image" content={ogImage} />}
<link rel="alternate" type="application/rss+xml" title={`${SITE.name} RSS`} href="/rss.xml" />
<script type="application/ld+json" set:html={JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  author: { '@type': 'Person', name: SITE.author },
})} />
```

- [x] **Step 2: `src/layouts/Base.astro`**

```astro
---
import { Font } from 'astro:assets';
import Seo from '@components/Seo.astro';
import Header from '@components/Header.astro';
import Footer from '@components/Footer.astro';
import '@styles/reset.css';
import '@styles/tokens.css';
import '@styles/base.css';
import '@styles/layout.css';
import '@styles/utilities.css';

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: Date;
}
const { title, description, image, type, publishedTime } = Astro.props;
---
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <style is:inline>@layer reset, tokens, base, layout, components, utilities;</style>
    <script is:inline>
      // Apply the stored theme before first paint. Hashed by Astro CSP in Phase 6.
      (() => {
        try {
          const t = localStorage.getItem('theme');
          if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
        } catch {}
      })();
    </script>
    <Font cssVariable="--font-sans" preload />
    <Font cssVariable="--font-mono" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <Seo {title} {description} {image} {type} {publishedTime} />
    <slot name="head" />
  </head>
  <body>
    <div class="container site">
      <Header />
      <main id="main" class="site-main"><slot /></main>
      <Footer />
    </div>
  </body>
</html>

<style>
  @layer components {
    .site { display: flex; flex-direction: column; min-height: 100dvh; }
    .site-main { flex: 1; padding-block: var(--space-6); font-size: var(--step-0); }
  }
</style>
```

- [x] **Step 3: Favicon**

Copy the legacy favicon SVG (three circles) from `main` if present, else create a minimal one:
```bash
git show main:src/images/doticon.svg > public/favicon.svg 2>/dev/null || cat > public/favicon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 24"><circle cx="12" cy="12" r="10" fill="#ff63d5"/><circle cx="32" cy="12" r="10" fill="#4200a0"/><circle cx="52" cy="12" r="10" fill="#4b5563"/></svg>
SVG
head -c 200 public/favicon.svg; echo
```
Expected: an `<svg` opening tag.

- [x] **Step 4: Update `src/pages/index.astro` to use the layout**

```astro
---
import Base from '@layouts/Base.astro';
---
<Base title="SimonGreer.co.uk" description="Simon Greer: blog posts and notes on self-hosting, Linux, networking, web development and the tools behind them.">
  <h2 class="uppercase-label">Recent blog posts</h2>
  <p>Content arrives in Phase 2.</p>
</Base>
```

Header and Footer do not exist yet; create temporary stubs so the build passes, replaced in Tasks 8–10:
```bash
mkdir -p src/components
printf -- '---\n---\n<header>header</header>\n' > src/components/Header.astro
printf -- '---\n---\n<footer>footer</footer>\n' > src/components/Footer.astro
```

- [x] **Step 5: Build and inspect the head**

```bash
bun run build 2>&1 | grep -E "Complete|error" ; grep -oE '<(link rel="canonical"[^>]*|meta property="og:title"[^>]*|link rel="preload"[^>]*)>' dist/index.html
```
Expected: `[build] Complete!`, a canonical of `https://simongreer.co.uk/`, an `og:title` of `SimonGreer.co.uk`, and a font preload pointing at `/_astro/fonts/...woff2`.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(rebuild): base layout with SEO head, fonts API and CSS layers"
```

---

### Task 7: `ThemeToggle.astro`

**Files:**
- Create: `src/components/ThemeToggle.astro`, `tests/e2e/shell.spec.ts`

- [x] **Step 1: Failing e2e test for the toggle**

`tests/e2e/shell.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('theme toggle switches and persists (desktop pre-header)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pre-header is hidden on mobile');
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme', /.+/);
  await page.getByRole('button', { name: /switch to dark/i }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /switch to light/i }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

// The mobile variant lives in Task 9 because it needs the mobile menu.
```

- [x] **Step 2: Run to see it fail**

```bash
bun run build && bunx playwright test tests/e2e/shell.spec.ts --project=desktop 2>&1 | tail -5
```
Expected: `1 failed` on desktop (button not found); mobile is skipped.

- [x] **Step 3: Write the component**

`src/components/ThemeToggle.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
interface Props { class?: string }
const { class: className } = Astro.props;
---
<button type="button" class:list={['theme-toggle', className]} data-theme-toggle aria-label="Switch to dark theme">
  <Icon name="material-symbols:dark-mode-outline" class="icon icon-dark" aria-hidden="true" />
  <Icon name="material-symbols:light-mode-outline" class="icon icon-light" aria-hidden="true" />
</button>

<script>
  const KEY = 'theme';
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');

  function current(): 'light' | 'dark' {
    const t = root.dataset.theme;
    if (t === 'light' || t === 'dark') return t;
    return media.matches ? 'dark' : 'light';
  }
  function label(btn: HTMLButtonElement) {
    btn.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]:not([data-ready])')) {
    btn.dataset.ready = '';
    label(btn);
    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch {}
      for (const b of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) label(b);
    });
  }
  media.addEventListener('change', () => {
    if (!root.dataset.theme) for (const b of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) label(b);
  });
</script>

<style>
  @layer components {
    .theme-toggle { display: inline-grid; place-items: center; inline-size: 2rem; block-size: 2rem; color: inherit; transition: transform var(--motion-fast) var(--ease); }
    .theme-toggle:hover { transform: scale(1.25); }
    .icon { inline-size: 1.25rem; block-size: 1.25rem; }
    .icon-light { display: none; }
    :root[data-theme='dark'] .icon-dark { display: none; }
    :root[data-theme='dark'] .icon-light { display: block; }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme='light']) .icon-dark { display: none; }
      :root:not([data-theme='light']) .icon-light { display: block; }
    }
  }
</style>
```

- [x] **Step 4: Put the toggle in the Header stub so the test can find it**

```bash
cat > src/components/Header.astro <<'ASTRO'
---
import ThemeToggle from '@components/ThemeToggle.astro';
---
<header><ThemeToggle /></header>
ASTRO
bun run build && bunx playwright test tests/e2e/shell.spec.ts 2>&1 | tail -5
```
Expected: `1 passed, 1 skipped`.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(rebuild): theme toggle with light-dark() and persisted preference"
```

---

### Task 8: `services` collection (nav data)

**Files:**
- Create: `src/content.config.ts`, `src/content/services.json`, `tests/unit/services.test.ts`

Only the fields the nav needs are populated now. `sections`, `skills` and `intro` are filled in Phase 4 and are optional in the schema until then.

- [x] **Step 1: Failing unit test**

`tests/unit/services.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import services from '../../src/content/services.json';

const FILTERS_IN_USE = ['ai-automation','broadcast-networking','business','cloud-and-hosted','data-and-databases','design-and-deployment','networking','software-development','storage','web-development'];

describe('services.json', () => {
  it('has unique ids that are URL-safe', () => {
    const ids = services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
  it('claims every hireme_filter value in use exactly once', () => {
    const all = services.flatMap((s) => s.filters);
    expect([...all].sort()).toEqual([...FILTERS_IN_USE].sort());
  });
  it('exposes exactly four nav entries in the legacy order', () => {
    expect(services.filter((s) => s.inNav).map((s) => s.id)).toEqual(['web-development','business-apps','networking-and-security','storage-and-nas']);
  });
});
```

- [x] **Step 2: Run to see it fail**

```bash
bun run test:unit 2>&1 | tail -5
```
Expected: FAIL, cannot resolve `services.json`.

- [x] **Step 3: Write `src/content/services.json`**

```json
[
  { "id": "web-development", "title": "Web Development", "navLabel": "Web Development", "inNav": true, "icon": "material-symbols:code-rounded", "filters": ["web-development"] },
  { "id": "business-apps", "title": "Business Apps", "navLabel": "Business Apps", "inNav": true, "icon": "material-symbols:business-center-outline", "filters": ["business"] },
  { "id": "cloud-and-hosted", "title": "Cloud & Hosted Services", "navLabel": "Cloud & Hosted", "inNav": false, "icon": "material-symbols:cloud-outline", "filters": ["cloud-and-hosted"] },
  { "id": "networking-and-security", "title": "Networking, Security & VPNs", "navLabel": "Networking, Security, VPNs", "inNav": true, "icon": "material-symbols:lan-outline", "filters": ["networking", "broadcast-networking"] },
  { "id": "storage-and-nas", "title": "Storage & NAS", "navLabel": "Storage, NAS", "inNav": true, "icon": "material-symbols:storage-rounded", "filters": ["storage"] },
  { "id": "software-development", "title": "Software Development", "navLabel": "Software Development", "inNav": false, "icon": "material-symbols:terminal-rounded", "filters": ["software-development"] },
  { "id": "data-and-databases", "title": "Data & Databases", "navLabel": "Data & Databases", "inNav": false, "icon": "material-symbols:database-outline", "filters": ["data-and-databases"] },
  { "id": "system-design-and-deployment", "title": "System Design, Deployment & Administration", "navLabel": "System Design & Deployment", "inNav": false, "icon": "material-symbols:architecture-rounded", "filters": ["design-and-deployment"] },
  { "id": "ai-and-automation", "title": "AI & Automation", "navLabel": "AI & Automation", "inNav": false, "icon": "material-symbols:smart-toy-outline", "filters": ["ai-automation"] }
]
```
Then add the new icon names to the `material-symbols` include list in `astro.config.ts`: `code-rounded`, `business-center-outline`, `cloud-outline`, `lan-outline`, `storage-rounded`, `terminal-rounded`, `database-outline`, `architecture-rounded`, `smart-toy-outline`.

- [x] **Step 4: Write `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: file('./src/content/services.json'),
  schema: z.object({
    title: z.string(),
    navLabel: z.string(),
    inNav: z.boolean(),
    icon: z.string().regex(/^material-symbols:[a-z0-9-]+$/),
    filters: z.array(z.string()).min(1),
    // Filled in Phase 4:
    intro: z.string().optional(),
    skills: z.array(z.object({ label: z.string(), icon: z.string() })).optional(),
    sections: z
      .array(
        z.object({
          heading: z.string(),
          icon: z.string(),
          body: z.string(),
          pros: z.array(z.string()).optional(),
          cons: z.array(z.string()).optional(),
          screenshots: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() })).optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { services };
```
Blog, tech, projects, clients, testimonials and tags collections are added in Phase 2. Until then the legacy MDX under `src/content/{blog,tech,...}` is not loaded by Astro because no collection references those folders.

- [x] **Step 5: Run tests and the build**

```bash
bun run test:unit 2>&1 | tail -5 && bun run build 2>&1 | grep -E "Complete|error|services"
```
Expected: `5 passed` (2 site + 3 services); `[build] Complete!` with no schema errors. If the build reports that `src/content/blog` contains files not belonging to a collection, that is a warning only; it disappears in Phase 2.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(rebuild): services collection driving hire-me navigation"
```

---

### Task 9: `Nav.astro` and `Header.astro`

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/components/Header.astro`, `tests/e2e/shell.spec.ts`

Visual reference (spec source §1.6): a 40px blue pre-header with social icons left and the toggle right, rounded top corners; a white 64px navbar with rounded bottom corners, logo (three circles + wordmark) left, three items right with icons; active item is a pink pill with white text; hover is pale purple; the Hire Me item opens a dropdown of `inNav` services; on mobile the pre-header is hidden and a hamburger opens a full-height overlay menu that also contains the toggle.

- [x] **Step 1: Extend the e2e test**

Append to `tests/e2e/shell.spec.ts`:
```ts
async function openMobileMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  return page.locator('[data-mobile-menu]');
}

test('header shows nav items and marks the active one', async ({ page, isMobile }) => {
  await page.goto('/');
  const scope = isMobile ? await openMobileMenu(page) : page.locator('.desktop-nav');
  const nav = scope.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Blog Posts' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'About Me' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'About Me' })).not.toHaveAttribute('aria-current');
});

test('hire me dropdown lists the four nav services', async ({ page, isMobile }) => {
  test.skip(isMobile, 'dropdown is desktop only');
  await page.goto('/');
  await page.locator('.desktop-nav').getByText('Hire Me').click();
  const menu = page.getByRole('list', { name: 'Hire me services' });
  await expect(menu.getByRole('link')).toHaveCount(4);
  await expect(menu.getByRole('link', { name: /Networking, Security, VPNs/ })).toHaveAttribute('href', '/hire-me/networking-and-security/');
});

test('mobile menu opens as a modal and contains the theme toggle', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Blog Posts' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'true');
});

test('mobile menu traps focus, closes on Escape and restores focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
    const inside = await page.evaluate(() => document.activeElement?.closest('[data-mobile-menu]') !== null);
    expect(inside, `tab ${i} left the dialog`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('mobile menu closes itself when the viewport grows past the breakpoint', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
});

test('theme toggle works from the mobile menu and persists', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  await dialog.getByRole('button', { name: /switch to dark/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
```

- [x] **Step 2: Run to see the new tests fail**

```bash
bun run build && bunx playwright test tests/e2e/shell.spec.ts 2>&1 | tail -6
```
Expected: on desktop the header and dropdown tests fail (navigation not found) and the toggle test passes; on mobile the five mobile tests fail (`Open menu` not found).

- [x] **Step 3: Write `src/components/Nav.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import { getCollection } from 'astro:content';
import { NAV_ITEMS } from '@lib/site';

const services = (await getCollection('services')).filter((s) => s.data.inNav);
const path = Astro.url.pathname;
const isActive = (root: string) => path === root || path.startsWith(`${root}/`);
---
<nav class="nav" aria-label="Main">
  <ul class="nav-list" role="list">
    {NAV_ITEMS.map((item) =>
      item.hasServicesMenu ? (
        <li class="nav-item has-menu">
          <details class="menu" data-nav-menu>
            <summary class:list={['nav-link', { active: isActive(item.root) }]}>
              <Icon name={item.icon} class="nav-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </summary>
            <ul class="menu-panel" role="list" aria-label="Hire me services">
              {services.map((s) => (
                <li>
                  <a class="menu-link" href={`/hire-me/${s.id}/`}>
                    <Icon name={s.data.icon} class="nav-icon" aria-hidden="true" />
                    <span>{s.data.navLabel}</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </li>
      ) : (
        <li class="nav-item">
          <a class:list={['nav-link', { active: isActive(item.root) }]} href={item.href} aria-current={isActive(item.root) ? 'page' : undefined}>
            <Icon name={item.icon} class="nav-icon" aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        </li>
      ),
    )}
  </ul>
</nav>

<script>
  // Close an open dropdown when clicking outside or pressing Escape.
  for (const details of document.querySelectorAll<HTMLDetailsElement>('[data-nav-menu]:not([data-ready])')) {
    details.dataset.ready = '';
    document.addEventListener('click', (e) => {
      if (details.open && !details.contains(e.target as Node)) details.open = false;
    });
    details.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') details.open = false;
    });
  }
</script>

<style>
  @layer components {
    .nav-list { display: flex; gap: var(--space-2); align-items: center; }
    .nav-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4) var(--space-2) var(--space-3);
      border-radius: var(--radius-lg); font-size: var(--step--1); font-weight: 500;
      color: var(--color-text); text-decoration: none; cursor: pointer; list-style: none;
      transition: background-color var(--motion-fast) var(--ease), color var(--motion-fast) var(--ease);
    }
    .nav-link::-webkit-details-marker { display: none; }
    .nav-link:hover { background: var(--color-nav-hover-bg); color: var(--color-purple); text-decoration: none; }
    .nav-link.active { background: var(--color-nav-active); color: white; }
    .nav-icon { inline-size: 1.125rem; block-size: 1.125rem; }

    .has-menu { position: relative; }
    .menu-panel {
      position: absolute; inset-inline-end: 0; top: calc(100% + var(--space-2)); z-index: 20;
      inline-size: 16rem; padding: var(--space-2);
      background: var(--color-surface-raised); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
    }
    .menu-link {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3);
      border-radius: var(--radius-md); font-size: var(--step--1); font-weight: 500; color: var(--color-text); text-decoration: none;
    }
    .menu-panel li + li .menu-link { border-top: 1px solid var(--color-border); border-radius: 0; }
    .menu-link:hover { background: var(--color-nav-hover-bg); color: var(--color-purple); }

    /* Inside the mobile overlay the list stacks and the dropdown is always open */
    :global([data-mobile-menu]) .nav-list { flex-direction: column; align-items: stretch; gap: var(--space-3); }
    :global([data-mobile-menu]) .nav-link { font-size: var(--step-2); }
    :global([data-mobile-menu]) .nav-icon { inline-size: 2.5rem; block-size: 2.5rem; }
    :global([data-mobile-menu]) .menu-panel { position: static; inline-size: auto; box-shadow: none; border: 0; padding-inline-start: var(--space-6); background: transparent; }
  }
</style>
```

- [x] **Step 4: Write `src/components/Header.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import Nav from '@components/Nav.astro';
import ThemeToggle from '@components/ThemeToggle.astro';
import { SITE } from '@lib/site';
---
<header class="header">
  <div class="preheader">
    <ul class="cluster socials" role="list">
      {SITE.socials.map((s) => (
        <li><a href={s.href} aria-label={s.label} rel="me noopener" target="_blank"><Icon name={s.icon} class="social-icon" aria-hidden="true" /></a></li>
      ))}
    </ul>
    <ThemeToggle />
  </div>

  <div class="navbar">
    <a class="brand" href="/" aria-label={`${SITE.name} home`}>
      <span class="dots" aria-hidden="true"><i class="dot dot-pink"></i><i class="dot dot-purple"></i><i class="dot dot-grey"></i></span>
      <span class="wordmark">{SITE.name}</span>
    </a>

    <div class="desktop-nav"><Nav /></div>

    <button type="button" class="burger" data-menu-open aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false">
      <Icon name="material-symbols:menu-rounded" aria-hidden="true" />
    </button>
  </div>

  <dialog id="mobile-menu" class="mobile-menu" data-mobile-menu aria-label="Menu">
    <div class="mobile-top">
      <button type="button" class="burger" data-menu-close aria-label="Close menu">
        <Icon name="material-symbols:close-rounded" aria-hidden="true" />
      </button>
      <ThemeToggle class="mobile-toggle" />
    </div>
    <Nav />
  </dialog>
</header>

<script>
  // Native modal dialog: showModal() makes the rest of the page inert, traps focus,
  // and closes on Escape. We only manage aria-expanded, focus restoration and the breakpoint.
  const menu = document.querySelector<HTMLDialogElement>('[data-mobile-menu]');
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const close = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (menu && open && close && !menu.dataset.ready) {
    menu.dataset.ready = '';
    open.addEventListener('click', () => {
      menu.showModal();
      open.setAttribute('aria-expanded', 'true');
      close.focus();
    });
    close.addEventListener('click', () => menu.close());
    menu.addEventListener('close', () => {
      open.setAttribute('aria-expanded', 'false');
      open.focus();
    });
    matchMedia('(min-width: 48rem)').addEventListener('change', (e) => {
      if (e.matches && menu.open) menu.close();
    });
  }
</script>

<style>
  @layer components {
    .header { view-transition-name: site-header; }
    .preheader {
      display: none; align-items: center; justify-content: space-between;
      block-size: var(--preheader-height); padding-inline: var(--space-4);
      background: var(--color-band); color: var(--color-band-text);
      border: 1px solid var(--color-border-strong); border-block-end: 0;
      border-start-start-radius: var(--radius-lg); border-start-end-radius: var(--radius-lg);
    }
    .socials { --cluster-gap: var(--space-4); }
    .social-icon { inline-size: 1.25rem; block-size: 1.25rem; color: var(--color-band-text); transition: transform var(--motion-fast) var(--ease); }
    .socials a:hover .social-icon { transform: scale(1.25); }

    .navbar {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
      min-block-size: var(--header-height); padding-inline: var(--space-4);
      background: var(--color-surface); border: 1px solid var(--color-border-strong);
      border-end-start-radius: var(--radius-lg); border-end-end-radius: var(--radius-lg);
    }
    .brand { display: inline-flex; align-items: center; gap: var(--space-3); text-decoration: none; color: var(--color-text-muted); font-size: var(--step-3); font-weight: 600; }
    .brand:hover { text-decoration: none; color: var(--color-text-muted); }
    .dots { display: inline-flex; gap: 2px; }
    .dot { inline-size: 0.9rem; block-size: 0.9rem; border-radius: 50%; display: block; }
    .dot-pink { background: var(--color-logo-pink); }
    .dot-purple { background: var(--color-logo-purple); }
    .dot-grey { background: light-dark(oklch(48% 0 0), white); }

    .desktop-nav { display: none; }
    .burger { display: inline-grid; place-items: center; inline-size: 2.5rem; block-size: 2.5rem; color: var(--color-text); }
    .burger svg { inline-size: 1.75rem; block-size: 1.75rem; }

    .mobile-menu {
      position: fixed; inset: 0; z-index: 50; padding: var(--space-5); margin: 0; border: 0;
      inline-size: 100vw; block-size: 100dvh; max-inline-size: none; max-block-size: none;
      background: var(--color-surface); color: var(--color-text); overflow-y: auto;
    }
    .mobile-menu::backdrop { background: transparent; }
    :global(body:has(.mobile-menu[open])) { overflow: hidden; }
    .mobile-top { display: flex; justify-content: space-between; align-items: center; margin-block-end: var(--space-6); }
    .mobile-toggle { color: var(--color-text); }

    @media (min-width: 48rem) {
      .preheader { display: flex; }
      .navbar { border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
      .desktop-nav { display: block; }
      .burger, .mobile-menu { display: none; }
    }
  }
</style>
```
The toggle inherits `currentColor`, so it is white inside `.preheader` and text-coloured inside the mobile overlay without extra rules.

- [x] **Step 5: Build, run the shell tests on both projects**

```bash
bun run build && bunx playwright test tests/e2e/shell.spec.ts 2>&1 | tail -8
```
Expected: `8 passed, 6 skipped` (desktop: toggle, header, dropdown; mobile: header, modal, focus trap, breakpoint, mobile toggle).

- [x] **Step 6: Check and commit**

```bash
bun run check 2>&1 | tail -5
git add -A
git commit -m "feat(rebuild): header with pre-header, brand, nav, services dropdown and mobile menu"
```

---

### Task 10: `Footer.astro`

**Files:**
- Modify: `src/components/Footer.astro`
- Modify: `tests/e2e/shell.spec.ts`

Visual reference: a blue block with rounded top corners holding three columns (recent posts, links, powered-by logos in white) and a pink bottom bar with the wordmark left and a copyright line right. Recent posts are filled from the blog collection in Phase 2 via a named slot; this task renders the block with an empty slot.

- [x] **Step 1: Extend the e2e test**

Append to `tests/e2e/shell.spec.ts`:
```ts
test('footer shows links and the pink bar with the current year', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/get-in-touch/');
  await expect(footer.getByText(String(new Date().getFullYear()))).toBeVisible();
});
```

- [x] **Step 2: Run to see it fail, then write the component**

```bash
bun run build && bunx playwright test tests/e2e/shell.spec.ts -g footer 2>&1 | tail -4
```
Expected: `2 failed` (one per project).

`src/components/Footer.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { SITE } from '@lib/site';
const year = new Date().getFullYear();
const powered = [
  { name: 'Astro', icon: 'simple-icons:astro' },
  { name: 'Cloudflare', icon: 'simple-icons:cloudflare' },
  { name: 'Bun', icon: 'simple-icons:bun' },
  { name: 'TypeScript', icon: 'simple-icons:typescript' },
];
---
<footer class="footer">
  <div class="band">
    <section class="col col-posts">
      <h2 class="footer-heading">Recent blog posts</h2>
      <slot name="recent-posts"><p class="muted">Posts appear here once content is migrated.</p></slot>
    </section>
    <section class="col col-links">
      <h2 class="footer-heading">Links</h2>
      <ul role="list" class="stack">
        <li><a href="/get-in-touch/">Get in touch</a></li>
        <li><a href={SITE.repo} rel="noopener" target="_blank">GitHub for this site</a></li>
        <li><a href="/rss.xml">RSS feed</a></li>
      </ul>
    </section>
    <section class="col col-powered">
      <h2 class="footer-heading">Powered by</h2>
      <ul role="list" class="cluster logos">
        {powered.map((p) => (<li><Icon name={p.icon} title={p.name} class="logo" /></li>))}
      </ul>
    </section>
  </div>
  <div class="bar">
    <span class="wordmark">{SITE.name}</span>
    <span class="copy">All content human-written, mistakes included. © {year}</span>
  </div>
</footer>

<style>
  @layer components {
    .footer { view-transition-name: site-footer; margin-block-start: var(--space-6); }
    .band {
      display: grid; gap: var(--space-6); padding: var(--space-6) var(--space-5);
      grid-template-columns: 1fr;
      background: var(--color-band); color: var(--color-band-text);
      border: 1px solid var(--color-border-strong); border-block-end: 0;
      border-start-start-radius: var(--radius-lg); border-start-end-radius: var(--radius-lg);
    }
    .footer-heading { font-size: var(--step-0); font-weight: 600; text-transform: uppercase; margin-block-end: var(--space-3); color: light-dark(white, var(--color-purple)); }
    .band a { color: var(--color-band-text); font-weight: 400; font-size: var(--step--1); }
    .band a:hover { text-decoration: underline; color: var(--color-band-text); }
    .muted { font-size: var(--step--1); opacity: 0.8; }
    .stack { --stack-gap: var(--space-2); }
    .logos { --cluster-gap: var(--space-4); }
    .logo { inline-size: 3.5rem; block-size: 3.5rem; color: white; }
    .col-powered { display: none; }

    .bar {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-3);
      padding: var(--space-4); background: var(--color-pink); color: white;
      border-end-start-radius: var(--radius-lg); border-end-end-radius: var(--radius-lg);
    }
    .wordmark { font-size: var(--step-3); font-weight: 600; }
    .copy { font-size: var(--step--1); }

    @media (min-width: 40rem) { .band { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 48rem) {
      .band { grid-template-columns: 4fr 3fr 2fr; }
      .col-powered { display: block; }
    }
  }
</style>
```

- [x] **Step 3: Build and test**

```bash
bun run build && bunx playwright test tests/e2e/shell.spec.ts 2>&1 | tail -5
```
Expected: `10 passed, 6 skipped`.

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(rebuild): footer band, links and pink bar"
```

---

### Task 11: 404 page, `_headers`, `_redirects`, and visual baseline

**Files:**
- Create: `src/pages/404.astro`, `public/_headers`, `public/_redirects`, `tests/e2e/visual.spec.ts`

- [x] **Step 1: `src/pages/404.astro`**

```astro
---
import Base from '@layouts/Base.astro';
---
<Base title="Page not found" description="That page does not exist on SimonGreer.co.uk.">
  <div class="stack">
    <h1>Page not found</h1>
    <p>The page you were looking for isn't here. Try the <a href="/blog/">blog</a> or go <a href="/">home</a>.</p>
  </div>
</Base>
```

- [x] **Step 2: `public/_headers`** (CSP is added by Astro's meta emission in Phase 6, not here)

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/pagefind/*
  Cache-Control: public, max-age=3600

/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
```

- [x] **Step 3: `public/_redirects`** generated from the manifest

```bash
node -e "
const m=require('./docs/specs/route-manifest.json');
const lines=m.rows.filter(r=>r.action==='redirect').map(r=>\`\${r.currentPath} \${r.newPath} 301\`);
require('fs').writeFileSync('public/_redirects', lines.join('\n')+'\n');
console.log(lines.join('\n'));"
```
Expected: 5 lines including `/me/ /me/personally/ 301` and `/hire-me/system-administration/ /hire-me/system-design-and-deployment/ 301`.

- [x] **Step 4: Verify headers and redirects under `wrangler dev`**

```bash
bun run build
(bun run preview > /tmp/wr.log 2>&1 &) ; sleep 6
curl -sI http://127.0.0.1:8787/ | grep -iE "^(x-frame-options|strict-transport|referrer-policy)"
curl -sI http://127.0.0.1:8787/me/ | grep -iE "^(HTTP|location)"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/nope/
A=$(ls dist/_astro/*.css | head -1 | xargs basename); curl -sI "http://127.0.0.1:8787/_astro/$A" | grep -i cache-control
pkill -f "wrangler dev" || true
```
Expected: the three security headers present; `HTTP/1.1 301` with `location: /me/personally/`; `404` for the unknown path (served by `404.astro`); `cache-control: public, max-age=31536000, immutable` for the CSS file.

- [x] **Step 5: Visual baseline test**

`tests/e2e/visual.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`shell snapshot (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`home-${theme}.png`, { fullPage: true });
  });
}
```

```bash
bunx playwright test tests/e2e/visual.spec.ts --update-snapshots 2>&1 | tail -3
ls tests/e2e/visual.spec.ts-snapshots/
```
Expected: 4 PNG files (`home-light-desktop-linux.png`, `home-dark-desktop-linux.png`, `home-light-mobile-linux.png`, `home-dark-mobile-linux.png`).

- [x] **Step 6: Side-by-side check against the live site (human gate)**

Open `tests/e2e/visual.spec.ts-snapshots/home-light-desktop-linux.png` and `https://simongreer.co.uk/` side by side. The header band colours, wordmark, nav pill, footer band and pink bar should match in hue and proportion. Adjust `tokens.css` OKLCH values until they do, re-run `--update-snapshots`, and note any changed values in the commit message. This is the first checkpoint for spec criterion 4; Simon reviews the four PNGs before this task is committed.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(rebuild): 404 page, static headers/redirects and visual baseline of the shell"
```

---

### Task 12: CI workflow with per-commit Worker preview

**Files:**
- Create: `.github/workflows/ci.yml`, `lighthouserc.json`, `docs/runbooks/workers-builds-setup.md`

Prerequisite (manual, recorded in the runbook): the Worker `simongreer-site` must exist so `wrangler versions upload` has a target. Create it once with an empty first deploy from the worktree:

```bash
export CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare/token) CLOUDFLARE_ACCOUNT_ID=$(cat ~/.cloudflare/account_id)
bun run build && bunx wrangler deploy 2>&1 | tail -5
```
Expected: `Deployed simongreer-site triggers` and a URL `https://simongreer-site.sideways-systems.workers.dev`. Visit it: the placeholder home renders. The token in `~/.cloudflare/token` must include `Workers Scripts:Edit`; if the command fails with 403, create a token per the `cloudflare` skill's token reference and retry. Also copy the `PAGESPEED_WEBHOOK_URL` environment secret to a repo-level secret: `gh secret set PAGESPEED_WEBHOOK_URL` (paste the value from the Mattermost webhook settings; it is not readable from GitHub).

- [x] **Step 1: `lighthouserc.json`**

```json
{
  "ci": {
    "collect": { "numberOfRuns": 3, "settings": { "preset": "mobile" } },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 1 }],
        "categories:seo": ["error", { "minScore": 1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```
URLs are supplied on the command line in CI so the same file serves previews and production.

- [x] **Step 2: `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main, rebuild/astro7]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  build-test-preview:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version

      - name: Install
        run: bun install --frozen-lockfile

      - name: Check (astro check, biome, knip)
        run: bun run check

      - name: Unit tests (source only)
        run: bun run test:unit

      - name: Build
        run: bun run build

      - name: Route manifest tests (needs fresh dist)
        run: bun run test:routes

      - name: Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: E2E against wrangler dev
        run: bunx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report

      - name: Upload Worker version (preview, no traffic)
        id: version
        run: |
          set -euo pipefail
          OUT=$(bunx wrangler versions upload --tag "${GITHUB_SHA::12}" --message "ci ${GITHUB_REF_NAME} ${GITHUB_SHA::12}" 2>&1 | tee /tmp/wv.log)
          URL=$(grep -oE 'https://[a-z0-9-]+-simongreer-site\.sideways-systems\.workers\.dev' /tmp/wv.log | head -1)
          test -n "$URL" || { echo "no preview URL in output"; cat /tmp/wv.log; exit 1; }
          echo "url=$URL" >> "$GITHUB_OUTPUT"
          echo "Preview: $URL" >> "$GITHUB_STEP_SUMMARY"

      - name: Wait for preview
        run: |
          for i in $(seq 1 24); do
            code=$(curl -s -o /dev/null -w '%{http_code}' "${{ steps.version.outputs.url }}/") && [ "$code" = "200" ] && exit 0
            sleep 5
          done
          echo "preview not ready"; exit 1

      - name: Headers on preview
        run: |
          curl -sI "${{ steps.version.outputs.url }}/" | tee /tmp/h.txt
          grep -qi '^x-frame-options: DENY' /tmp/h.txt
          grep -qi '^strict-transport-security:' /tmp/h.txt

      - name: Lighthouse on preview
        run: bunx lhci autorun --collect.url="${{ steps.version.outputs.url }}/"
        continue-on-error: true
        # Thresholds become blocking (continue-on-error removed) in Phase 6 once real pages exist.

      - name: Comment preview URL on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const url = '${{ steps.version.outputs.url }}';
            await github.rest.issues.createComment({ ...context.repo, issue_number: context.issue.number,
              body: `Preview for ${context.sha.slice(0,12)}: ${url}` });

      - name: Mattermost summary
        if: always() && env.PAGESPEED_WEBHOOK_URL != ''
        env:
          PAGESPEED_WEBHOOK_URL: ${{ secrets.PAGESPEED_WEBHOOK_URL }}
        run: |
          STATUS="${{ job.status }}"
          curl -s -X POST -H 'Content-Type: application/json' \
            -d "{\"text\": \"simongreer-site ci ${STATUS} on ${GITHUB_REF_NAME} ${GITHUB_SHA::12} — preview ${{ steps.version.outputs.url }}\"}" \
            "$PAGESPEED_WEBHOOK_URL"
```
Note the `if:` for the Mattermost step reads `env.PAGESPEED_WEBHOOK_URL`, not `secrets.*`, because the `secrets` context is not allowed in job/step `if:` (the bug that broke the old bench workflows). The secret is mapped into `env` on that step.

- [x] **Step 3: Write the runbook**

`docs/runbooks/workers-builds-setup.md`:
```markdown
# Workers Builds setup for simongreer-site

Manual steps done once in the Cloudflare dashboard (Workers & Pages → simongreer-site → Settings → Builds). Record the date and who did it at the bottom.

1. Connect repository `sigreer/simongreer.co.uk`.
2. Production branch: `rebuild/astro7` (switched to `main` at cutover step 7 in the spec).
3. Build command: `bun install --frozen-lockfile && bun run build`
4. Deploy command: `bunx wrangler deploy`
5. Non-production branch builds: **disabled** (CI produces per-commit version previews instead).
6. Build variables: none required (all vars live in wrangler.jsonc).
7. Secrets on the Worker (Settings → Variables and Secrets): `TURNSTILE_SECRET_KEY` (set in Phase 5).
8. Email Service: verify destination address `simon@simongreer.co.uk` under Email → Email Service before Phase 5, then add the `send_email` binding to `wrangler.jsonc` in Phase 5.
9. Turnstile widget: create in Phase 5 with hostnames `simongreer.co.uk`, `sideways-systems.workers.dev`, `localhost`.

Verification after the first Workers Build: `bunx wrangler deployments list` shows a deployment whose source is the connected repo and whose message contains the commit SHA on `rebuild/astro7`.

| Date | Done by | Notes |
|---|---|---|
| | | |
```

- [x] **Step 4: Validate the workflow file locally and commit**

```bash
node -e "require('js-yaml')" 2>/dev/null && node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/ci.yml','utf8')); console.log('yaml ok')" || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('yaml ok')"
git add -A
git commit -m "ci(rebuild): build, test, per-commit Worker preview version, Lighthouse and Mattermost summary"
```

- [x] **Step 5: Push and watch the first run**

```bash
git push -u origin rebuild/astro7
SHA=$(git rev-parse HEAD)
for i in $(seq 1 12); do
  RUN_ID=$(gh run list --workflow ci.yml --commit "$SHA" --json databaseId -q '.[0].databaseId')
  [ -n "$RUN_ID" ] && break; sleep 5
done
echo "run=$RUN_ID sha=$SHA"
gh run watch "$RUN_ID" --exit-status
gh run view "$RUN_ID" --log | grep -oE 'Preview: https://[^ ]+' | head -1
bunx wrangler versions list 2>/dev/null | head -8
```
Expected: `run=<id>` for this exact SHA; the run succeeds and prints a preview URL of the form `https://<hash>-simongreer-site.sideways-systems.workers.dev`. Open it: the shell renders. Record the SHA, run id, the Worker version id from `wrangler versions list` (its tag is the 12-char SHA) and the preview URL in the runbook table. If `wrangler versions upload` fails with an authentication error, the repo secret `CLOUDFLARE_API_TOKEN` lacks `Workers Scripts:Edit`; rotate it per the `cloudflare` skill token reference and re-run.

- [ ] **Step 6: Complete the Workers Builds runbook**

> **Status 2026-09-29: deferred, owner Simon.** Dashboard-only step; not automatable by agents. Tracked in the exit-gate table in `docs/handoffs/rebuild-phase-0-1-closeout.md`.

Perform the dashboard steps in `docs/runbooks/workers-builds-setup.md` steps 1–6, fill in the table row, then:
```bash
git add docs/runbooks/workers-builds-setup.md
git commit -m "docs(rebuild): record Workers Builds setup"
git push
```
Expected: within a few minutes `bunx wrangler deployments list | head -12` shows a new deployment from Workers Builds for the pushed commit, and `https://simongreer-site.sideways-systems.workers.dev/` serves the shell.

---

## Phase 0–1 exit criteria (verify before closing)

> Status as of 2026-09-29: see the exit-gate table in `docs/handoffs/rebuild-phase-0-1-closeout.md` for the evidence SHA and location of each gate. The task steps above are historical implementation instructions; recorded deviations are listed in the closeout under "Decisions and plan deviations".

Run from `$WT`:

```bash
bun run check && bun run test && bunx playwright test && echo PHASE-0-1-OK
```
Expected: all pass and `PHASE-0-1-OK` prints.

Then confirm:

- [x] `docs/specs/route-manifest.json` exists with `drop`, `redirect` and `keep` rows and the langchain collision resolved in favour of `langchain.mdx`.
- [x] `git log --oneline main..rebuild/astro7 | wc -l` shows at least 11 commits.
- [x] The CI run for the head SHA of `rebuild/astro7` is green and its summary shows a preview URL that serves the shell; SHA, run id, version id and URL are recorded in `docs/runbooks/workers-builds-setup.md`.
- [ ] Workers Builds has deployed the same commit to `simongreer-site.sideways-systems.workers.dev`. **Deferred, owner Simon** (dashboard step; see the closeout exit-gate table).
- [x] Simon has looked at the four shell snapshots against the live site (Task 11 step 6).
- [x] Invoke `superstar:external-review --kind post-phase` on this plan with the spec as context before starting the Phase 2 plan.

## Deferred to later phase plans (not gaps)

- Content collections, `getPublished`, blog/tech/projects routes, RSS, sitemap filter, OG images, `routes.test.ts`: Phase 2.
- Home hero, cards, tag filter: Phase 3. Services page bodies, panels, tiles, lightbox, gallery, carousel: Phase 4.
- `contact` Action, Turnstile, email, removal of `spike.astro` and `ping`: Phase 5.
- Search UI, `security.csp`, blocking Lighthouse thresholds, Web Analytics beacon, cutover runbook execution: Phase 6–7.
