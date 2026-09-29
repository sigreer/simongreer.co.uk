<!-- superstar-prompt:start -->
You are acting as an independent senior engineering reviewer.

Review stance:
- Lead with findings, ordered by severity.
- Focus on correctness, consistency, implementation risk, missing acceptance
  gates, vague handoffs, ungrounded assumptions, unverified claims, and drift
  from the codebase.
- Give exact file/line references when possible.
- If the document is sound, say that clearly and list residual risks.
- Keep the review actionable. Avoid broad rewrites unless the current structure
  creates concrete risk.

Repository root:
/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7

Target kind:
post-phase

Review mode:
Post-phase review. Treat this as a closeout gate for a whole
phase. Compare the implementation, archive/TASKLIST updates, and verification
evidence against the phase spec/plan. Prioritize: unresolved acceptance
criteria, stale docs, missing archive notes, cross-cutting tracker drift,
deferred gates without justification, and regressions outside the phase scope.

Target document:
docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md

Additional context files:
- docs/specs/2026-09-28-site-rebuild-design.md
- docs/handoffs/rebuild-phase-0-1-closeout.md
- docs/runbooks/workers-builds-setup.md

Review output contract:
1. Findings
   - Tag each finding with a stable ID: `F1`, `F2`, `F3`, …. IDs must remain
     stable if this review is iterated in subsequent rounds.
   - Mark severity inline: `Severity: blocking | important | minor | nit`.
2. Open questions / assumptions
3. Suggested document edits
4. Verification gaps / commands that should be run, if any

End your review with this exact line, as plain text on its own line:

    Overall verdict: <ready|ready with small edits|revise>

Do not bold, italicise, prefix with `##`, split across lines, or drop the
word "Overall". Do not write `**Verdict: ready**` or place the value on a
new line after a heading.

Read the files from disk. Do not rely only on the snippets in this prompt.


## Target Preview

### docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md

    1	# Rebuild Phase 0–1: Scaffold, Tooling, CI Preview Pipeline and Site Shell — Implementation Plan
    2	
    3	> **For agentic workers:** REQUIRED SUB-SKILL: Use superstar:subagent-driven-development (recommended) or superstar:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
    4	
    5	**Goal:** Produce a deployable Astro 7 skeleton on Cloudflare Workers with the design-token system, base layout, header, footer and theme toggle, plus the route manifest and a CI pipeline that publishes a per-commit preview URL.
    6	
    7	**Architecture:** A fresh Astro 7 project on branch `rebuild/astro7` (git worktree) replaces the old tree. All pages are prerendered static assets served by Workers Static Assets; the Worker only serves Actions, the image endpoint and 404. Styling is vanilla CSS in cascade layers with OKLCH tokens and `light-dark()`. No client framework. CI runs checks and tests, builds, uploads a tagged Worker version and reports its preview URL.
    8	
    9	**Tech Stack:** Astro 7.3+, `@astrojs/cloudflare` 14.3+, Wrangler 4, Bun 1.4, Biome 2, Knip 6, Vitest 5, Playwright 1.63, astro-icon + Iconify (material-symbols, simple-icons), GitHub Actions.
   10	
   11	**Spec:** `docs/specs/2026-09-28-site-rebuild-design.md` (phases 0 and 1 of §14). Later phases (content routes, hire-me, contact form, search/CSP/cutover) get their own plans once this skeleton exists.
   12	
   13	**Conventions used throughout this plan**
   14	
   15	- Repo root on the worktree is referred to as `$WT`. Set it once per shell: `export WT=/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7`.
   16	- Every command runs from `$WT` unless stated.
   17	- Commit after every task with the message shown. Do not squash.
   18	- "Expected:" lines show the essential output; extra lines are fine.
   19	- Shell snippets that pipe into `tail`/`grep` assume `set -o pipefail` (zsh: `setopt pipefail`) so a failing command is not masked by the filter. Set it once per shell before starting.
   20	
   21	---
   22	
   23	## File structure created by this plan
   24	
   25	| Path | Responsibility |
   26	|---|---|
   27	| `scripts/gen-route-manifest.mjs` | Reads old `src/content` frontmatter and writes `docs/specs/route-manifest.json` |
   28	| `docs/specs/route-manifest.json` | Old path → new path → action, consumed by tests in Phase 2 |
   29	| `package.json`, `.bun-version`, `tsconfig.json`, `.gitignore`, `.dev.vars.example` | Project metadata and toolchain pins |
   30	| `src/content.config.ts` | Created empty in Task 2 (replaces legacy `src/content/config.ts`), filled with `services` in Task 8 |
   31	| `src/assets/fonts/*.woff2` | Geist fonts consumed by the Fonts API (moved from `public/fonts`) |
   32	| `astro.config.ts` | Astro config: adapter, fonts, integrations, `session: false` |
   33	| `wrangler.jsonc` | Worker name, assets, bindings, vars, observability |
   34	| `biome.json`, `knip.json`, `vitest.config.ts`, `playwright.config.ts` | Quality tooling |
   35	| `src/env.d.ts` | Types for `cloudflare:workers` env |
   36	| `src/actions/index.ts` | `ping` spike action (replaced by `contact` in Phase 5) |
   37	| `src/styles/{reset,tokens,base,layout,utilities}.css` | Design system |
   38	| `src/layouts/Base.astro` | HTML shell, head, layers, header/footer |
   39	| `src/components/{Seo,Header,Nav,ThemeToggle,Footer}.astro` | Shell components |
   40	| `src/lib/site.ts` | Site constants (name, socials, nav items) |
   41	| `src/content/services.json` | `services` collection data (nav needs it; sections filled in Phase 4) |
   42	| `src/pages/index.astro`, `src/pages/404.astro`, `src/pages/spike.astro` | Placeholder home, 404, spike page (spike removed in Phase 5) |
   43	| `public/_headers`, `public/_redirects` | Static headers and redirects |
   44	| `tests/unit/site.test.ts`, `tests/e2e/shell.spec.ts`, `tests/e2e/spike.spec.ts` | Tests |
   45	| `.github/workflows/ci.yml` | CI + preview version upload |
   46	| `docs/runbooks/workers-builds-setup.md` | Manual Cloudflare dashboard steps recorded as a runbook |
   47	
   48	---
   49	
   50	### Task 0: Worktree, branch and toolchain
   51	
   52	**Files:**
   53	- Create: worktree at `/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7`
   54	
   55	- [ ] **Step 1: Commit the planning documents on `main`** (they are currently untracked, so a worktree from `main` would not contain them)
   56	
   57	```bash
   58	cd /home/simon/Dev/sigreer/simongreer.co.uk/simongreer.co.uk
   59	git add docs/audit docs/specs docs/plans docs/reviewer docs/handoffs
   60	git commit -m "docs: codebase audit, rebuild design spec, phase 0-1 plan and review chains"
   61	git push origin main
   62	```
   63	Expected: one commit containing `docs/specs/2026-09-28-site-rebuild-design.md` and this plan. The pre-existing uncommitted change to `scripts/icon-helper.sh` is left alone (it belongs to the old tree and is deleted in Task 2).
   64	
   65	- [ ] **Step 2: Create the branch and worktree from local `main`**
   66	
   67	```bash
   68	git worktree add -b rebuild/astro7 ../rebuild-astro7 main
   69	export WT=/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7
   70	cd $WT && git status --short | head && ls docs/specs docs/plans
   71	```
   72	Expected: `Preparing worktree (new branch 'rebuild/astro7')`, an empty status, and both the spec and this plan listed.
   73	
   74	- [ ] **Step 3: Upgrade Bun and record the version**
   75	
   76	```bash
   77	bun upgrade
   78	bun --version
   79	```
   80	Expected: a version `1.4.x` or later. Record it; it is used in Task 2 and Task 12 as `<BUN_VERSION>`.
   81	
   82	- [ ] **Step 4: Confirm Node meets Astro 7's requirement**
   83	
   84	```bash
   85	node --version
   86	```
   87	Expected: `v22.12.0` or newer (local machine has v26).
   88	
   89	No commit for this task.
   90	
   91	---
   92	
   93	### Task 1: Route manifest generator (runs against the OLD tree before anything is deleted)
   94	
   95	**Files:**
   96	- Create: `scripts/gen-route-manifest.mjs`
   97	- Create: `docs/specs/route-manifest.json` (generated)
   98	
   99	- [ ] **Step 1: Write the generator**
  100	
  101	```js
  102	// scripts/gen-route-manifest.mjs
  103	// Reads the OLD content tree (Astro 5 layout) and emits docs/specs/route-manifest.json.
  104	// Run once from the repo root while src/content still holds the legacy frontmatter.
  105	// MANIFEST_OUT overrides the output path; REVERSE_ORDER=1 enumerates files backwards (self-check).
  106	import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
  107	import { join } from 'node:path';
  108	
  109	const root = process.cwd();
  110	const outFile = process.env.MANIFEST_OUT || 'docs/specs/route-manifest.json';
  111	const collections = [
  112	  { name: 'blog', dir: 'src/content/blog', prefix: '/blog/' },
  113	  { name: 'tech', dir: 'src/content/tech', prefix: '/tech/' },
  114	  { name: 'projects', dir: 'src/content/projects', prefix: '/tech/projects/' },
  115	];
  116	
  117	function frontmatter(file) {
  118	  const text = readFileSync(file, 'utf8');
  119	  const m = text.match(/^---\n([\s\S]*?)\n---/);
  120	  if (!m) throw new Error(`no frontmatter in ${file}`);
  121	  const out = {};
  122	  for (const line of m[1].split('\n')) {
  123	    const kv = line.match(/^(\w+):\s*(.*)$/);
  124	    if (kv) out[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim();
  125	  }
  126	  return out;
  127	}
  128	
  129	// Pass 1: collect entries with their legacy path and desired new id.
  130	const entries = [];
  131	for (const c of collections) {
  132	  const files = readdirSync(join(root, c.dir)).filter((n) => /\.mdx?$/.test(n));
  133	  if (process.env.REVERSE_ORDER) files.reverse(); // used by the self-check to prove order independence
  134	  for (const f of files) {
  135	    const file = join(c.dir, f);
  136	    const fm = frontmatter(join(root, file));
  137	    const filename = f.replace(/\.mdx?$/, '');
  138	    const slug = fm.slug || filename; // Astro 5 glob loader used slug as id when present
  139	    entries.push({ c, file, filename, slug, status: fm.status || 'published', title: fm.title || '', currentPath: `${c.prefix}${slug}/` });
  140	  }
  141	}
  142	
  143	const rows = [];
  144	const live = entries.filter((e) => {
  145	  if (e.status !== 'published') { rows.push(row(e, null, 'drop', `status ${e.status}`)); return false; }
  146	  if (e.title === 'Project Title') { rows.push(row(e, null, 'drop', 'placeholder entry')); return false; }
  147	  return true;
  148	});
  149	
  150	// Pass 2: desired new id per entry, then resolve collisions deterministically.
  151	for (const e of live) {
  152	  e.newId = e.slug.endsWith('.mdx') ? e.slug.replace(/\.mdx$/, '') : e.slug;
  153	}
  154	const byTarget = new Map();
  155	for (const e of live) {
  156	  const key = `${e.c.prefix}${e.newId}/`;
  157	  byTarget.set(key, [...(byTarget.get(key) || []), e]);
  158	}
  159	for (const [target, group] of byTarget) {
  160	  if (group.length === 1) continue;
  161	  // Rule: the entry whose filename equals the contested id owns it; every other entry falls back to its filename.
  162	  const owners = group.filter((e) => e.filename === e.newId);
  163	  if (owners.length !== 1) throw new Error(`unresolvable collision for ${target}: ${group.map((g) => g.file).join(', ')}`);
  164	  for (const e of group) if (e !== owners[0]) { e.newId = e.filename; e.collidedWith = owners[0].file; }
  165	}
  166	
  167	for (const e of live) {
  168	  const newPath = `${e.c.prefix}${e.newId}/`;
  169	  if (e.collidedWith) rows.push(row(e, newPath, 'keep', `slug collided with ${e.collidedWith}; uses filename ${e.filename} (new path, no redirect)`));
  170	  else if (e.slug.endsWith('.mdx')) rows.push(row(e, newPath, 'redirect', 'slug contained .mdx'));
  171	  else if (e.slug !== e.filename) rows.push(row(e, newPath, 'keep', `rename file ${e.filename}.mdx -> ${e.slug}.mdx`));
  172	  else rows.push(row(e, newPath, 'keep', 'unchanged'));
  173	}
  174	
  175	function row(e, newPath, action, reason) {
  176	  return { collection: e.c.name, file: e.file, currentPath: e.currentPath, newPath, action, reason };
  177	}
  178	
  179	// Static aliases and service pages
  180	rows.push({ collection: 'static', file: null, currentPath: '/me/', newPath: '/me/personally/', action: 'redirect', reason: 'existing rule' });
  181	rows.push({ collection: 'static', file: null, currentPath: '/me/get-in-touch/', newPath: '/get-in-touch/', action: 'redirect', reason: 'replaces meta-refresh page' });
  182	rows.push({ collection: 'static', file: null, currentPath: '/home/', newPath: null, action: 'drop', reason: 'orphan duplicate of /' });
  183	for (const [oldPage, target] of [
  184	  ['vpn-setup-routing-wireguard-ipsec-openvpn', 'networking-and-security'],
  185	  ['system-administration', 'system-design-and-deployment'],
  186	]) rows.push({ collection: 'services', file: null, currentPath: `/hire-me/${oldPage}/`, newPath: `/hire-me/${target}/`, action: 'redirect', reason: 'page merged (spec §4.3)' });
  187	for (const p of ['web-development','business-apps','cloud-and-hosted','networking-and-security','storage-and-nas','software-development','data-and-databases','system-design-and-deployment'])
  188	  rows.push({ collection: 'services', file: null, currentPath: `/hire-me/${p}/`, newPath: `/hire-me/${p}/`, action: 'keep', reason: 'service page' });
  189	rows.push({ collection: 'services', file: null, currentPath: null, newPath: '/hire-me/ai-and-automation/', action: 'keep', reason: 'new service page (spec §4.3)' });
  190	
  191	// Self-checks
  192	const kept = rows.filter((r) => r.action === 'keep').map((r) => r.newPath);
  193	if (new Set(kept).size !== kept.length) throw new Error('duplicate kept destination paths');
  194	const find = (file) => rows.find((r) => r.file === file);
  195	if (find('src/content/tech/langchain.mdx')?.newPath !== '/tech/langchain/') throw new Error('langchain must own /tech/langchain/');
  196	if (find('src/content/tech/flowise.mdx')?.newPath !== '/tech/flowise/') throw new Error('flowise must move to /tech/flowise/');
  197	
  198	rows.sort((a, b) => `${a.collection}${a.currentPath}${a.file}`.localeCompare(`${b.collection}${b.currentPath}${b.file}`));
  199	writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2) + '\n');
  200	const counts = rows.reduce((acc, r) => ((acc[r.action] = (acc[r.action] || 0) + 1), acc), {});
  201	console.log(JSON.stringify(counts));
  202	```
  203	
  204	- [ ] **Step 2: Run it in both enumeration orders and confirm identical output**
  205	
  206	```bash
  207	cd $WT && mkdir -p docs/specs
  208	node scripts/gen-route-manifest.mjs
  209	MANIFEST_OUT=/tmp/manifest-reversed.json REVERSE_ORDER=1 node scripts/gen-route-manifest.mjs
  210	diff <(jq -S 'del(.generatedAt)' docs/specs/route-manifest.json) <(jq -S 'del(.generatedAt)' /tmp/manifest-reversed.json) && echo ORDER-INDEPENDENT
  211	jq -r '.rows[] | select(.action!="keep" or (.reason!="unchanged" and .reason!="service page")) | "\(.action)\t\(.currentPath) -> \(.newPath) | \(.reason)"' docs/specs/route-manifest.json
  212	```
  213	Expected: both runs print exactly `{"drop":7,"keep":80,"redirect":5}`, then `ORDER-INDEPENDENT`, then 19 notable rows including:
  214	```
  215	keep	/blog/funky-square-dance-icon-set-svg/ -> /blog/funky-square-dance-icon-set-svg/ | rename file funkysquaredance-icon-set.mdx -> funky-square-dance-icon-set-svg.mdx
  216	keep	/tech/langchain/ -> /tech/flowise/ | slug collided with src/content/tech/langchain.mdx; uses filename flowise (new path, no redirect)
  217	redirect	/tech/projects/voip-with-all-of-the-features-and-none-of-the-cost.mdx/ -> /tech/projects/voip-with-all-of-the-features-and-none-of-the-cost/ | slug contained .mdx
  218	redirect	/hire-me/system-administration/ -> /hire-me/system-design-and-deployment/ | page merged (spec §4.3)
  219	drop	/tech/projects/another-project/ -> null | placeholder entry
  220	```
  221	The script's own self-checks throw if kept destinations are not unique, if `langchain.mdx` does not own `/tech/langchain/`, or if `flowise.mdx` does not land on `/tech/flowise/`. A thrown error means the content differs from what the audit recorded; investigate before continuing.
  222	
  223	- [ ] **Step 3: Commit**
  224	
  225	```bash
  226	git add scripts/gen-route-manifest.mjs docs/specs/route-manifest.json
  227	git commit -m "chore(rebuild): generate route manifest from legacy content"
  228	```
  229	
  230	---
  231	
  232	### Task 2: Wipe the old tree and scaffold Astro 7
  233	
  234	**Files:**
  235	- Delete: everything except `src/content`, `src/images`, `public/fonts`, `public/images`, `docs/`, `scripts/gen-route-manifest.mjs`, `.git`
  236	- Create: `package.json`, `.bun-version`, `tsconfig.json`, `.gitignore`, `.dev.vars.example`, `astro.config.ts`, `wrangler.jsonc`, `src/env.d.ts`, `src/pages/index.astro`
  237	
  238	- [ ] **Step 1: Remove the legacy tree**
  239	
  240	```bash
  241	cd $WT
  242	git rm -rq --cached . 
  243	find . -mindepth 1 -maxdepth 1 ! -name .git ! -name docs ! -name src ! -name public ! -name scripts -exec rm -rf {} +
  244	find src -mindepth 1 -maxdepth 1 ! -name content ! -name images -exec rm -rf {} +
  245	rm -f src/content/config.ts   # legacy location; Astro 6+ raises LegacyContentConfigError if it remains
  246	find public -mindepth 1 -maxdepth 1 ! -name fonts ! -name images -exec rm -rf {} +
  247	find scripts -mindepth 1 ! -name gen-route-manifest.mjs -exec rm -rf {} +
  248	ls
  249	```
  250	Expected: `docs  public  scripts  src`.
  251	
  252	- [ ] **Step 2: Write `package.json`** (replace `<BUN_VERSION>` with the value from Task 0)
  253	
  254	```json
  255	{
  256	  "name": "simongreer-site",
  257	  "version": "2.0.0",
  258	  "private": true,
  259	  "type": "module",
  260	  "packageManager": "bun@<BUN_VERSION>",
  261	  "engines": { "node": ">=22.12.0" },
  262	  "scripts": {
  263	    "dev": "wrangler types && astro dev",
  264	    "build": "wrangler types && astro build && pagefind --site dist",
  265	    "preview": "wrangler dev --port 8787",
  266	    "check": "wrangler types && astro check && biome check . && knip",
  267	    "format": "biome check --write .",
  268	    "test:unit": "vitest run tests/unit --exclude tests/unit/routes.test.ts",
  269	    "test:routes": "vitest run tests/unit/routes.test.ts --passWithNoTests",
  270	    "test": "bun run test:unit && bun run build && bun run test:routes",
  271	    "test:e2e": "playwright test",
  272	    "lighthouse": "lhci autorun"
  273	  },
  274	  "dependencies": {
  275	    "@astrojs/cloudflare": "^14.3.3",
  276	    "@astrojs/mdx": "^8.0.2",
  277	    "@astrojs/rss": "^4.0.15",
  278	    "@astrojs/sitemap": "^3.7.0",
  279	    "astro": "^7.3.5",
  280	    "astro-expressive-code": "^0.44.2",
  281	    "astro-icon": "^1.1.5",
  282	    "@iconify-json/material-symbols": "^1.2.0",
  283	    "@iconify-json/simple-icons": "^1.2.0"
  284	  },
  285	  "devDependencies": {
  286	    "@astrojs/check": "^0.9.6",
  287	    "@biomejs/biome": "2.5.14",
  288	    "@lhci/cli": "^0.15.1",
  289	    "@playwright/test": "^1.63.0",
  290	    "knip": "^6.38.0",
  291	    "pagefind": "^1.5.2",
  292	    "typescript": "^5.9.3",
  293	    "vitest": "^5.0.2",
  294	    "wrangler": "^4.143.0"
  295	  }
  296	}
  297	```
  298	
  299	- [ ] **Step 3: Write the small config files**
  300	
  301	`.bun-version`:
  302	```
  303	<BUN_VERSION>
  304	```
  305	
  306	`tsconfig.json`:
  307	```json
  308	{
  309	  "extends": "astro/tsconfigs/strict",
  310	  "compilerOptions": {
  311	    "baseUrl": ".",
  312	    "paths": {
  313	      "@/*": ["src/*"],
  314	      "@components/*": ["src/components/*"],
  315	      "@layouts/*": ["src/layouts/*"],
  316	      "@lib/*": ["src/lib/*"],
  317	      "@styles/*": ["src/styles/*"],
  318	      "@images/*": ["src/images/*"]
  319	    },
  320	    "types": ["./worker-configuration.d.ts"]
  321	  },
  322	  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "astro.config.ts", "vitest.config.ts", "playwright.config.ts"],
  323	  "exclude": ["dist", "node_modules"]
  324	}
  325	```
  326	
  327	`.gitignore`:
  328	```
  329	node_modules/
  330	dist/
  331	.astro/
  332	.wrangler/
  333	worker-configuration.d.ts
  334	.dev.vars
  335	.env
  336	.env.*
  337	!.dev.vars.example
  338	test-results/
  339	playwright-report/
  340	tests/e2e/__snapshots__/**/*-actual.png
  341	.lighthouseci/
  342	```
  343	
  344	`.dev.vars.example`:
  345	```
  346	# Copy to .dev.vars for local development. Never commit .dev.vars.
  347	TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
  348	```
  349	
  350	- [ ] **Step 4: Write `wrangler.jsonc`**
  351	
  352	```jsonc
  353	{
  354	  "$schema": "node_modules/wrangler/config-schema.json",
  355	  "name": "simongreer-site",
  356	  "main": "@astrojs/cloudflare/entrypoints/server",
  357	  "compatibility_date": "2026-09-28",
  358	  "compatibility_flags": ["nodejs_compat"],
  359	  "assets": {
  360	    "directory": "./dist",
  361	    "binding": "ASSETS",
  362	    "not_found_handling": "404-page"
  363	  },
  364	  "observability": { "enabled": true },
  365	  "placement": { "mode": "smart" },
  366	  "preview_urls": true,
  367	  "vars": {
  368	    "SITE_URL": "https://simongreer.co.uk",
  369	    "TURNSTILE_SITE_KEY": "1x00000000000000000000AA",
  370	    "CONTACT_TO_EMAIL": "simon@simongreer.co.uk",
  371	    "CONTACT_FROM_EMAIL": "website@simongreer.co.uk"
  372	  },
  373	  // Bindings below are declared now so `wrangler types` generates their types.
  374	  // The contact Action that uses them is Phase 5. The `send_email` binding is
  375	  // added in Phase 5 too, after the destination address is verified in the
  376	  // dashboard, so that no deploy depends on an unverified address.
  377	  "ratelimits": [{ "name": "CONTACT_RATE_LIMIT", "namespace_id": "1001", "simple": { "limit": 3, "period": 60 } }],
  378	  "images": { "binding": "IMAGES" }
  379	}
  380	```
  381	Note: `TURNSTILE_SITE_KEY` is the documented always-pass test key until Phase 5 creates the real widget. `CONTACT_*` addresses are placeholders to be confirmed with Simon in Phase 5.
  382	
  383	- [ ] **Step 5: Write `astro.config.ts`**
  384	
  385	```ts
  386	import { defineConfig, envField, fontProviders } from 'astro/config';
  387	import cloudflare from '@astrojs/cloudflare';
  388	import mdx from '@astrojs/mdx';
  389	import sitemap from '@astrojs/sitemap';
  390	import astroExpressiveCode from 'astro-expressive-code';
  391	import icon from 'astro-icon';
  392	
  393	export default defineConfig({
  394	  site: 'https://simongreer.co.uk',
  395	  output: 'static',
  396	  session: false,
  397	  prefetch: false,
  398	  adapter: cloudflare({
  399	    imageService: { build: 'compile', runtime: 'cloudflare-binding' },
  400	  }),
  401	  integrations: [
  402	    astroExpressiveCode({ themes: ['github-dark', 'github-light'] }),
  403	    mdx(),
  404	    sitemap(),
  405	    icon({
  406	      include: {
  407	        'material-symbols': ['newspaper-outline', 'work-outline', 'account-circle-outline', 'menu-rounded', 'close-rounded', 'light-mode-outline', 'dark-mode-outline', 'chevron-right-rounded'],
  408	        'simple-icons': ['github', 'bluesky', 'astro', 'cloudflare', 'bun', 'typescript'],
  409	      },
  410	    }),
  411	  ],
  412	  fonts: [
  413	    {
  414	      provider: fontProviders.local(),
  415	      name: 'Geist Sans',
  416	      cssVariable: '--font-sans',
  417	      options: { variants: [{ weight: '100 900', style: 'normal', src: ['./public/fonts/Geist[wght].woff2'] }] },
  418	    },
  419	    {
  420	      provider: fontProviders.local(),
  421	      name: 'Geist Mono',
  422	      cssVariable: '--font-mono',
  423	      options: { variants: [{ weight: '100 900', style: 'normal', src: ['./public/fonts/GeistMono[wght].woff2'] }] },
  424	    },
  425	  ],
  426	  env: {
  427	    schema: {
  428	      SITE_URL: envField.string({ context: 'client', access: 'public', default: 'https://simongreer.co.uk' }),
  429	      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
  430	    },
  431	  },
  432	  image: { formats: ['avif', 'webp'] },
  433	  build: { assets: '_astro' },
  434	});
  435	```
  436	The Fonts API copies the woff2 files into `dist/_astro/fonts/` with hashed names, so after this task `public/fonts` is moved to `src/assets/fonts` in Step 7 to avoid shipping duplicates.
  437	
  438	- [ ] **Step 6: Write `src/env.d.ts` and a placeholder page**
  439	
  440	`src/env.d.ts`:
  441	```ts
  442	/// <reference types="astro/client" />
  443	// Bindings and vars are typed by `wrangler types` into worker-configuration.d.ts (Env interface).
  444	// `import { env } from 'cloudflare:workers'` is typed by @cloudflare/workers-types via wrangler.
  445	```
  446	
  447	`src/content.config.ts` (empty for now; Task 8 adds the `services` collection):
  448	```ts
  449	export const collections = {};
  450	```
  451	
  452	`src/pages/index.astro`:
  453	```astro
  454	---
  455	const title = 'SimonGreer.co.uk';
  456	---
  457	<!doctype html>
  458	<html lang="en-GB">
  459	  <head><meta charset="utf-8" /><title>{title}</title></head>
  460	  <body><h1>{title}</h1></body>
  461	</html>
  462	```
  463	
  464	- [ ] **Step 7: Move fonts into `src/assets/fonts` and fix the config paths**
  465	
  466	```bash
  467	mkdir -p src/assets/fonts && git mv public/fonts/*.woff2 src/assets/fonts/ 2>/dev/null || mv public/fonts/*.woff2 src/assets/fonts/
  468	rmdir public/fonts
  469	sed -i "s#./public/fonts/#./src/assets/fonts/#g" astro.config.ts
  470	grep -n "assets/fonts" astro.config.ts
  471	```
  472	Expected: two lines showing `./src/assets/fonts/Geist[wght].woff2` and `./src/assets/fonts/GeistMono[wght].woff2`.
  473	
  474	- [ ] **Step 8: Install, type-check and build (in that order, as CI will)**
  475	
  476	Biome and Knip are configured in Task 4, so only the type-generation and Astro check run here; the full `bun run check` is first exercised in Task 4 step 7.
  477	
  478	```bash
  479	bun install
  480	bunx wrangler types && bunx astro check 2>&1 | tail -8
  481	bun run build 2>&1 | tail -20
  482	```
  483	Expected: `wrangler types` writes `worker-configuration.d.ts`, `astro check` reports 0 errors, then Astro prints `[build] Complete!`; Pagefind prints `Indexed 1 page` (or 0 pages, acceptable until content exists). No errors. If `astro build` complains that `session` is unknown, the installed Astro is older than 7.2: run `bun update astro` and retry.
  484	
  485	- [ ] **Step 9: Verify the Worker config is valid without deploying**
  486	
  487	```bash
  488	bunx wrangler deploy --dry-run --outdir /tmp/wr-dry 2>&1 | tail -15
  489	```
  490	Expected: `--dry-run: exiting now.` after a bindings summary that lists `env.ASSETS`, `env.CONTACT_RATE_LIMIT`, `env.IMAGES` and the four vars. No `✘` lines.
  491	
  492	- [ ] **Step 10: Commit**
  493	
  494	```bash
  495	git add -A
  496	git commit -m "feat(rebuild): scaffold Astro 7 on Cloudflare Workers with static assets"
  497	```
  498	
  499	---
  500	
  501	### Task 3: Spike — an Action reading `env` under the real Worker runtime
  502	
  503	**Files:**
  504	- Create: `src/actions/index.ts`, `src/pages/spike.astro` (deleted in Phase 5), `playwright.config.ts`, `tests/e2e/spike.spec.ts`
  505	
  506	- [ ] **Step 1: Write the Playwright config**
  507	
  508	`playwright.config.ts`:
  509	```ts
  510	import { defineConfig, devices } from '@playwright/test';
  511	
  512	export default defineConfig({
  513	  testDir: './tests/e2e',
  514	  timeout: 30_000,
  515	  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  516	  use: { baseURL: 'http://127.0.0.1:8787', trace: 'retain-on-failure' },
  517	  webServer: {
  518	    command: 'bun run preview',
  519	    url: 'http://127.0.0.1:8787/',
  520	    reuseExistingServer: !process.env.CI,
  521	    timeout: 120_000,
  522	  },
  523	  projects: [
  524	    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } } },
  525	    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  526	  ],
  527	});
  528	```
  529	
  530	- [ ] **Step 2: Write the failing e2e test**
  531	
  532	`tests/e2e/spike.spec.ts`:
  533	```ts
  534	import { test, expect } from '@playwright/test';
  535	
  536	test('ping action runs in the Worker and reads a binding var', async ({ page }) => {
  537	  await page.goto('/spike/');
  538	  await page.getByRole('button', { name: 'Ping' }).click();
  539	  await expect(page.locator('#out')).toHaveText('pong from https://simongreer.co.uk', { timeout: 10_000 });
  540	});
  541	```
  542	
  543	- [ ] **Step 3: Run it to see it fail**
  544	
  545	```bash
  546	bunx playwright install chromium
  547	bun run build && bunx playwright test tests/e2e/spike.spec.ts --project=desktop 2>&1 | tail -8
  548	```
  549	Expected: `1 failed` with a 404 on `/spike/`.
  550	
  551	- [ ] **Step 4: Write the action and the page**
  552	
  553	`src/actions/index.ts`:
  554	```ts
  555	import { defineAction } from 'astro:actions';
  556	import { z } from 'astro/zod';
  557	import { env } from 'cloudflare:workers';
  558	
  559	export const server = {
  560	  // Phase 0 spike. Replaced by `contact` in Phase 5.
  561	  ping: defineAction({
  562	    input: z.object({ who: z.string().min(1) }),
  563	    handler: async ({ who }) => {
  564	      return { reply: `pong from ${env.SITE_URL}`, who };
  565	    },
  566	  }),
  567	};
  568	```
  569	
  570	`src/pages/spike.astro` (a real route on purpose; Astro ignores `_`-prefixed files, and this page must be reachable under `wrangler dev`; Phase 5 deletes it):
  571	```astro
  572	---
  573	const title = 'Spike';
  574	---
  575	<!doctype html>
  576	<html lang="en-GB">
  577	  <head><meta charset="utf-8" /><title>{title}</title></head>
  578	  <body>
  579	    <button id="ping">Ping</button>
  580	    <output id="out"></output>
  581	    <script>
  582	      import { actions } from 'astro:actions';
  583	      document.getElementById('ping')!.addEventListener('click', async () => {
  584	        const { data, error } = await actions.ping({ who: 'spike' });
  585	        document.getElementById('out')!.textContent = error ? `error: ${error.message}` : data.reply;
  586	      });
  587	    </script>
  588	  </body>
  589	</html>
  590	```
  591	- [ ] **Step 5: Build and run the test**
  592	
  593	```bash
  594	bun run build && bunx playwright test tests/e2e/spike.spec.ts --project=desktop 2>&1 | tail -5
  595	```
  596	Expected: `1 passed`. This proves: Actions work with `output: 'static'`, `env` from `cloudflare:workers` resolves under `wrangler dev`, and the Worker serves `/_actions/ping` while `/spike/` is a static asset.
  597	
  598	- [ ] **Step 6: Commit**
  599	
  600	```bash

[truncated: 1473 additional lines]

## Context Previews

### docs/specs/2026-09-28-site-rebuild-design.md

    1	# Design: simongreer.co.uk rebuild on Astro 7 and Cloudflare Workers
    2	
    3	Date: 2026-09-28. Status: approved decisions, spec revision 2 (after review round 1).
    4	Source of decisions: `docs/audit/2026-09-28-audit-and-stack-proposal.md`, section 3.2, all six points approved by Simon on 2026-09-28.
    5	
    6	## 1. Goal
    7	
    8	Rebuild the site as a fresh Astro 7 project deployed to Cloudflare Workers with Static Assets, reproducing the current visual identity (audit section 1.6) with a vanilla CSS design system, no client framework, and a validated, bot-protected contact form. Content (blog, tech, projects, clients, testimonials, tags) is migrated, not rewritten. Content changes are a separate later plan.
    9	
   10	Out of scope: new sections, copy changes, layout redesign beyond responsive fixes, the benchmarking suite (deleted, not ported), and the immediate hot-fixes to the live site listed in audit section 3.4 (done separately on `main`).
   11	
   12	## 2. Success criteria
   13	
   14	Verifiable on the accepted preview revision (section 11.2) unless stated otherwise.
   15	
   16	1. `bun run check` passes: zero `astro check` errors, zero Biome errors, `knip` reports no unused files, exports or dependencies. `bun run build` succeeds and `wrangler deploy --dry-run` succeeds.
   17	2. **Route manifest.** `tests/unit/routes.test.ts` loads `docs/specs/route-manifest.json` (section 4.2) and asserts: every `keep` path exists in `dist/` as `index.html`; every `redirect` path appears in `public/_redirects` with its target and the target exists in `dist/`; no path listed as `drop` (drafts, hidden, archived, placeholders) exists in `dist/`.
   18	3. `curl -s <preview>/rss.xml` contains no `undefined`; every `<link>` path, with the host replaced by the preview host, returns 200.
   19	4. Playwright visual snapshots of `/`, `/blog`, one post, `/hire-me/web-development` and `/me/professionally`, in light and dark at 390px and 1360px, are reviewed and accepted by Simon against the live site.
   20	5. Lighthouse (mobile, `@lhci/cli`) against the accepted preview revision scores ≥ 95 performance, 100 accessibility, 100 best practices, 100 SEO on `/`, `/blog`, and one post.
   21	6. **Contact form**, tested in Playwright against the built Worker under `wrangler dev` with Turnstile test keys and `send_email` stubbed by Wrangler:
   22	   - valid submission returns success and the stub logs a message with `Reply-To` set to the submitter;
   23	   - invalid email, message under 10 characters, filled honeypot, and a failing Turnstile token (test "always fails" site key) each return a structured error and log no message;
   24	   - the 4th submission from one client within 60 seconds returns `TOO_MANY_REQUESTS`.
   25	   One manual end-to-end submission on the preview revision delivers a real email to the verified address.
   26	7. `curl -sI <preview>/_astro/<hashed file>` returns `cache-control: public, max-age=31536000, immutable`. HTML responses carry `strict-transport-security`, `referrer-policy`, `x-content-type-options`, `x-frame-options` and `permissions-policy` headers, and the HTML contains one `<meta http-equiv="content-security-policy">` whose policy blocks inline scripts without a matching hash (verified by a Playwright test that injects an unhashed inline script and asserts a CSP violation event).
   27	8. Client JavaScript shipped on a blog post page is under 15 KB compressed, excluding Pagefind's lazily loaded bundle. Turnstile's script loads only on pages containing the form.
   28	9. Search: `bun run build` runs Pagefind; a Playwright test types a known post title into the search box and asserts the result links to that post.
   29	10. No `react`, `tailwindcss`, `@astrojs/tailwind`, `sass` or Mailtrap-related package in `package.json`.
   30	
   31	## 3. Architecture
   32	
   33	### 3.1 Repository strategy
   34	
   35	Same repository, new branch `rebuild/astro7` in a git worktree. The first commit deletes `src/`, `public/`, config files and the old workflows, then scaffolds Astro 7. Content and images are copied from `main` with `git checkout main -- src/content src/images public/fonts public/images` and then pruned. The old code stays readable on `main` until the merge in section 11.4.
   36	
   37	### 3.2 Runtime topology
   38	
   39	```
   40	Browser ──> Cloudflare edge (zone simongreer.co.uk)
   41	              ├─ static asset match ──> Workers Static Assets (HTML, _astro/*, pagefind/*, images)
   42	              └─ no match ───────────> Worker (Astro server entry)
   43	                                          ├─ /_actions/contact  (Astro Action, JSON/form-data over fetch)
   44	                                          ├─ /_image            (runtime image transforms via IMAGES binding)
   45	                                          └─ 404 page (not_found_handling: "404-page")
   46	Bindings: ASSETS, EMAIL (send_email), CONTACT_RATE_LIMIT (ratelimit), IMAGES
   47	Secrets:  TURNSTILE_SECRET_KEY
   48	Vars:     SITE_URL, TURNSTILE_SITE_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
   49	```
   50	
   51	All pages are prerendered (`output: 'static'`). The only server-rendered endpoints are the Action and the image endpoint. `run_worker_first` is not set, so static assets never invoke the Worker. Bindings are accessed with `import { env } from 'cloudflare:workers'` (the adapter v14 contract; `Astro.locals.runtime` no longer exists).
   52	
   53	### 3.3 Configuration files
   54	
   55	- `astro.config.ts`: `site` from `SITE_URL`; `adapter: cloudflare({ imageService: { build: 'compile', runtime: 'cloudflare-binding' } })` so prerendered images are optimised at build and only runtime requests use the binding; `integrations: [expressiveCode(), mdx(), sitemap({ filter }), icon()]`; `fonts: [...]` with `fontProviders.local()` for Geist and Geist Mono; `security: { csp: { ... } }` (stable in 7.x; emits a `<meta http-equiv>` policy with per-page hashes); `prefetch: false`; no Tailwind plugin.
   56	- `wrangler.jsonc`: `name: "simongreer-site"`, `compatibility_date` = scaffold date, `compatibility_flags: ["nodejs_compat"]`, `assets: { directory: "./dist", binding: "ASSETS", not_found_handling: "404-page" }`, `send_email: [{ name: "EMAIL", destination_address: "<verified address>" }]`, `ratelimits: [{ name: "CONTACT_RATE_LIMIT", namespace_id: "1001", simple: { limit: 3, period: 60 } }]`, `images: { binding: "IMAGES" }`, `observability: { enabled: true }`, `placement: { mode: "smart" }`, `vars` as above, `preview_urls: true`.
   57	- `biome.json`, `knip.json`, `lighthouserc.json`, `playwright.config.ts`, `vitest.config.ts`.
   58	- `public/_headers` and `public/_redirects` (section 9 and 4.2).
   59	
   60	### 3.4 Directory layout
   61	
   62	```
   63	src/
   64	  actions/index.ts          contact action
   65	  components/               Header, Nav, ThemeToggle, Footer, Hero, Card, CardGrid, TagFilter,
   66	                            Prose, Toc, Panel, Badge, TechTile, TechGrid, ContactForm,
   67	                            Lightbox, Gallery, Carousel, ExternalLink, Seo, Search
   68	  content/                  migrated MDX + tags.json + services.json
   69	  content.config.ts
   70	  icons/                    logo + vendor SVGs not in Simple Icons
   71	  images/
   72	  layouts/                  Base.astro, Page.astro, Post.astro
   73	  lib/                      content.ts, seo.ts, turnstile.ts, email.ts
   74	  pages/                    index, blog/index, blog/[id], tech/index, tech/[id],
   75	                            tech/projects/index, tech/projects/[id],
   76	                            hire-me/index, hire-me/[service], me/personally,
   77	                            me/professionally, get-in-touch, rss.xml.ts,
   78	                            og/[...path].png.ts, 404.astro
   79	  styles/                   tokens.css, reset.css, base.css, layout.css, utilities.css
   80	tests/
   81	  unit/                     content.test.ts, routes.test.ts, seo.test.ts
   82	  e2e/                      smoke.spec.ts, visual.spec.ts, contact.spec.ts, headers.spec.ts, search.spec.ts
   83	docs/specs/route-manifest.json
   84	```
   85	
   86	## 4. Content model
   87	
   88	### 4.1 Schema changes
   89	
   90	All collections keep glob/file loaders. Changes:
   91	
   92	- Remove `slug` from blog, tech and projects. The glob loader today already uses `slug` as the entry id when present, so current public URLs are slug-based. To preserve URLs without redirects, files whose filename differs from their slug are **renamed to the slug** (see 4.2). The id is then always the filename.
   93	- `coverimage`, `vendoricon`, `horizontal_logo` become `image()` fields so a missing or misspelled file fails the build.
   94	- `description` becomes required for blog and projects; stays nullable for tech and clients.
   95	- Add `status` to clients and testimonials; migrated entries are set to `published`.
   96	- Testimonials: drop the redundant `client_name` reference.
   97	- Tech: keep `category` and `hireme_filter` enums. `hireme_filter` is validated against the union of `filters` declared in `services.json` (4.3). Unmatched filters fail the build.
   98	- Tags: add the 25 missing tag definitions, delete the 7 unused ones, rename id `open source` to `open-source` and update references.
   99	- Published entries referencing unpublished entries (project → client, testimonial → client/project) fail `tests/unit/content.test.ts`.
  100	
  101	### 4.2 Route manifest
  102	
  103	Routes: blog `/blog/<id>/`, tech `/tech/<id>/`, projects `/tech/projects/<id>/`, services `/hire-me/<service>/`.
  104	
  105	The implementer generates `docs/specs/route-manifest.json` mechanically from `main` before deleting anything: for every content entry, record the current public path (from `slug ?? filename`), the new path, the action (`keep`, `redirect`, `drop`) and the reason. The known cases from the audit, to be confirmed by the generator:
  106	
  107	| Current path | Action | New path / reason |
  108	|---|---|---|
  109	| `/blog/funky-square-dance-icon-set-svg` | keep | rename file `funkysquaredance-icon-set.mdx` → `funky-square-dance-icon-set-svg.mdx` |
  110	| `/blog/is-wordpress-still-a-viable-choice-in-2025` | keep | rename file `...-2024.mdx` → `...-2025.mdx` |
  111	| `/blog/truenas-scale-electric-eel` | keep | rename file `truenas-scale-electric-eel-first-look.mdx` |
  112	| `/tech/open-zfs-filesystem`, `/tech/microsoft-windows` | keep | rename `openzfs.mdx`, `windows.mdx` |
  113	| `/tech/langchain` (collision: flowise.mdx and langchain.mdx) | keep for langchain | `langchain.mdx` owns the path; `flowise.mdx` loses its `slug` and becomes `/tech/flowise/` (new page, no redirect, since the old path never showed Flowise reliably) |
  114	| `/tech/projects/voip-...-cost.mdx` | redirect | `/tech/projects/voip-with-all-of-the-features-and-none-of-the-cost/` |
  115	| 4 draft + 1 hidden blog posts | drop | status filter |
  116	| `/tech/projects/another-project` | drop | placeholder entry deleted |
  117	| `/home` | drop | orphan duplicate |
  118	| `/me` | redirect | `/me/personally` (existing rule) |
  119	| `/me/get-in-touch` | redirect | `/get-in-touch` (replaces the meta-refresh page) |
  120	| `/hire-me/<old page>` × 10 | keep or redirect | per the services table in 4.3 |
  121	
  122	Every `redirect` row becomes a line in `public/_redirects` with status 301.
  123	
  124	### 4.3 Services collection
  125	
  126	`src/content/services.json` (file loader) replaces the 11 hand-written hire-me pages. Fields: `id` (route segment), `title`, `navLabel`, `inNav` (boolean), `icon`, `intro`, `filters` (array of `hireme_filter` values whose tech entries appear in the vendor grid), `skills` (badge labels + icons), `sections` (heading, icon, body markdown, optional pros/cons, optional screenshots). Section body text is copied verbatim from the existing pages.
  127	
  128	Mapping from existing pages and filters. Every one of the 10 existing `hireme_filter` values in use is claimed exactly once.
  129	
  130	| Service id (route) | Source page | `filters` | Note |
  131	|---|---|---|---|
  132	| `web-development` | web-development | `web-development` | in nav |
  133	| `business-apps` | business-apps | `business` | in nav |
  134	| `cloud-and-hosted` | cloud-and-hosted | `cloud-and-hosted` | fixes the copy-paste bug that showed `business` |
  135	| `networking-and-security` | networking-and-security + vpn-setup-routing-wireguard-ipsec-openvpn | `networking`, `broadcast-networking` | in nav; the VPN page's sections merge in; `/hire-me/vpn-setup-routing-wireguard-ipsec-openvpn` 301s here |
  136	| `storage-and-nas` | storage-and-nas | `storage` | in nav |
  137	| `software-development` | software-development | `software-development` | |
  138	| `data-and-databases` | data-and-databases | `data-and-databases` | |
  139	| `system-design-and-deployment` | system-design-and-deployment + system-administration | `design-and-deployment` | `system-administration` matched zero entries; its sections merge here and `/hire-me/system-administration` 301s here |
  140	| `ai-and-automation` | new (sections from index intro) | `ai-automation` | 7 entries currently unreachable; minimal page, content plan may expand it |
  141	
  142	`hireme_filter` enum values `system-administration` and `media-server` are removed from the schema (zero entries). `/hire-me/` index lists all services.
  143	
  144	### 4.4 Publication helper
  145	
  146	`src/lib/content.ts` exports `getPublished(collection)` = `getCollection(c, e => e.data.status === 'published')`. Every page, RSS, sitemap filter and related lookup uses it. In `astro dev`, `SHOW_DRAFTS=1` includes drafts.
  147	
  148	### 4.5 MDX migration inventory
  149	
  150	Real component imports in content (Dart `import` lines inside code fences are not imports):
  151	
  152	| Content file | Imports | Migration |
  153	|---|---|---|
  154	| blog/astro-on-cloudflare-fully-automated (parts 1, 2, 3) | `@styles/lightbox.css`, `LightBox.astro`, 3–2 gallery PNGs | drop the CSS import (Lightbox is self-styled); import path becomes `@components/Lightbox.astro` with the same `src`/`alt`/`caption` props |
  155	| blog/fedora-kernel-upgrades-with-zfs | `GithubIcon.astro` | replace with `<Icon name="simple-icons:github">` from astro-icon; 3 Tailwind `class` attributes replaced with prose-scoped utilities |
  156	| blog/funkysquaredance-icon-set | `ExternalLink.astro`, `astro:assets` Image, 8 SVGs | keep; `ExternalLink` is rebuilt with the same props |
  157	| blog/magick-tricks-automate-screenshot-cover-images | `Carousel` (React), `Gallery.astro`, 4 images by `/images/galleries/...` public path | `Carousel` becomes the new scroll-snap `Carousel.astro` with an `images` prop; `Gallery.astro` rebuilt with the same props; the 4 public images move to `src/images/galleries/magick-tricks/` and are imported |
  158	| projects/lbwebrtc-embedded-linux-system-suite | `coverimage: /images/projects/lbwebrtc.jpg` (file missing) | provide the image or set a placeholder cover; build fails otherwise via `image()` |
  159	| Tailwind classes in 4 MDX files (19 occurrences) | | replaced by `.prose` scoped classes or removed; documented in the migration commit |
  160	
  161	Acceptance: `bun run build` succeeds and visual snapshots include the magick-tricks post (carousel and gallery) and part 1 of the Astro-on-Cloudflare series (lightbox) in addition to the pages in criterion 4.
  162	
  163	## 5. Design system (CSS)
  164	
  165	### 5.1 Layers and files
  166	
  167	`@layer reset, tokens, base, layout, components, utilities;` declared once in `Base.astro`. Files:
  168	
  169	- `tokens.css`: `:root { color-scheme: light dark; }` and all custom properties. Colours in OKLCH with `light-dark()` pairs, e.g. `--color-surface: light-dark(oklch(100% 0 0), oklch(20% 0 0))`. Brand: `--color-pink`, `--color-purple`, `--color-blue` converted from the audit HSL values. Semantic: `--color-bg-page`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-border-strong`, `--color-heading-accent` (text colour in light, purple in dark). Type: `--font-sans`, `--font-mono` (set by the Fonts API), fluid steps `--step--1` to `--step-4` via `clamp()` reproducing 16/18/19px root scaling. Space scale `--space-1` to `--space-10`. `--radius-sm/md/lg`, `--shadow-sm/md/lg`, `--container: 1360px`, `--motion-fast: 150ms`, `--motion-base: 300ms`.
  170	- `reset.css`: modern reset with `prefers-reduced-motion` guard.
  171	- `base.css`: html/body, headings, links, focus rings, `@view-transition { navigation: auto; }`, `view-transition-name` for header and footer.
  172	- `layout.css`: `.container`, `.stack`, `.cluster`, `.grid-auto` (container-query driven), `.split` (3/7 panel split that stacks under 48rem).
  173	- `utilities.css`: `.visually-hidden`, `.uppercase-label`, `.line-clamp-2`, `.line-clamp-5`, `.prose-icon`.
  174	- Component styles live in each `.astro` file's scoped `<style>` using only tokens. `@scope (.prose)` in `Prose.astro` for Markdown output.
  175	
  176	### 5.2 Theming
  177	
  178	Theme follows `color-scheme` via `light-dark()`. `ThemeToggle.astro` sets `data-theme="light|dark"` on `<html>`, which overrides via `:root[data-theme="dark"] { color-scheme: dark }`, and persists to `localStorage`. A hashed inline script in `<head>` applies the stored value before first paint. The toggle appears in the mobile nav as well as the desktop pre-header. Navigation is cross-document, so no re-run-on-swap logic exists.
  179	
  180	### 5.3 Motion
  181	
  182	Card hover lift and scale, icon hover scale, hero chevron nudge, dialog fade, all under `@media (prefers-reduced-motion: no-preference)`. Cross-document view transitions with a 200ms crossfade; header and footer keep position via shared `view-transition-name`. Scroll-driven animation is not used.
  183	
  184	## 6. Components
  185	
  186	Each component: one file, scoped styles, typed `Props`, no global side effects. Interactive ones use a `<script>` that queries `document.querySelectorAll('[data-<component>]')`, skips elements already marked `data-ready`, and marks them, so multiple instances and repeated execution are safe. `document.currentScript` is not used (it is null in bundled module scripts).
  187	
  188	| Component | Responsibility | Interactivity |
  189	|---|---|---|
  190	| `Seo` | title, description, canonical, OG/Twitter, JSON-LD (WebSite, BlogPosting, Person), RSS link, OG image URL | none |
  191	| `Header` + `Nav` | pre-header (social icons, toggle) and navbar (logo, items, hire-me dropdown from `services` where `inNav`, mobile overlay) | `<details>`-based dropdown and mobile menu; small script closes on outside click |
  192	| `ThemeToggle` | see 5.2 | ~20 lines |
  193	| `Footer` | recent posts, links, powered-by, pink bar | none |
  194	| `Hero` | latest post banner | none |
  195	| `Card`, `CardGrid` | post/tech/project cards with tag chips, `data-tags` | none |
  196	| `TagFilter` | tag buttons, toggles `hidden` on cards; state in `?tag=` | ~40 lines |
  197	| `Prose` | Markdown container, `data-pagefind-body` | none |
  198	| `Toc` | headings list, active state | IntersectionObserver, ~30 lines |
  199	| `Panel` | bordered panel with header strip, optional cross-hatch strip via CSS `repeating-linear-gradient` | none |
  200	| `Badge` | pill with Iconify icon | none |

[truncated: 106 additional lines]
### docs/handoffs/rebuild-phase-0-1-closeout.md

    1	# Rebuild Phase 0–1 closeout: Scaffold, Tooling, CI Preview Pipeline and Site Shell
    2	
    3	Branch `rebuild/astro7` (worktree `../rebuild-astro7`), based on `main` at `0905f0e8`.
    4	Plan: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`. Spec: `docs/specs/2026-09-28-site-rebuild-design.md`.
    5	
    6	## 2026-09-29 — Phase 0–1 slice summary (coordinator)
    7	
    8	Delivered:
    9	
   10	- Fresh Astro 7.3.5 project on Cloudflare Workers Static Assets (`@astrojs/cloudflare` 14.3.3, Wrangler 4.143, Bun 1.4.2), replacing the Astro 5 / React / Tailwind tree. Legacy content and images are retained under `src/content` and `src/images` for Phase 2.
   11	- Route manifest `docs/specs/route-manifest.json` generated from the legacy content (80 keep, 5 redirect, 7 drop; langchain owns `/tech/langchain/`, flowise moves to `/tech/flowise/`).
   12	- Working Astro Action under the real Worker runtime (`ping` spike reading `env.SITE_URL` from `cloudflare:workers`), proven by Playwright against `wrangler dev`.
   13	- Tooling: Biome 2.5 (lint + format, honours `.gitignore`), Knip 6, Vitest 5 (plain `vitest/config`), Playwright 1.63 (desktop + mobile projects, `E2E_PORT` override), `bun run check` green.
   14	- Design system: five vanilla CSS files in cascade layers with OKLCH tokens and `light-dark()`; brand colours matched to the live site's hex values during the visual pass.
   15	- Shell: `Base.astro` (fonts API, SEO head, pre-paint theme script, `@layer` order), `Seo.astro`, `Header.astro` (pre-header with socials + theme toggle, brand, `Nav.astro` with services dropdown fed by the new `services` collection, native `<dialog>` mobile menu), `ThemeToggle.astro`, `Footer.astro`, `404.astro`, `_headers`, `_redirects`.
   16	- Tests: 6 unit tests, 18 e2e tests (spike, shell, visual baselines at 390 and 1360 in light and dark). Simon approved the four shell snapshots against the live site on 2026-09-29 and chose to keep the inset container width.
   17	- CI (`.github/workflows/ci.yml`): check → unit → build → route tests → Playwright → `wrangler versions upload --tag <sha>` → wait → header check → Lighthouse (non-blocking) → PR comment → Mattermost (conditional). Worker `simongreer-site` created by a first manual deploy; `https://simongreer-site.sideways-systems.workers.dev` serves the shell; per-commit preview URLs recorded in `docs/runbooks/workers-builds-setup.md`. Head of branch at closeout: `3a52cf04`; last CI run on `a2d347c4` (run 36501029169) succeeded with preview `https://991bcc16-simongreer-site.sideways-systems.workers.dev`. Exit criteria (`bun run check`, `bun run test`, full Playwright suite: 17 passed, 7 skipped) verified on `c826e2fe`; `test:routes` runs zero tests by design until Phase 2.
   18	
   19	Decisions and plan deviations worth knowing:
   20	
   21	- Pagefind indexes `dist/client` (the adapter's deployable output), not `dist`. Phase 2's `routes.test.ts` must look in `dist/client`.
   22	- `image.formats` is not an Astro 7 config key; formats go on `<Picture>`.
   23	- Plan's `getViteConfig` for Vitest crashes under the Cloudflare adapter; plain `vitest/config` is used. Consequence: unit tests cannot import `astro:content` or resolve tsconfig path aliases. Phase 2 must choose an approach for `content.test.ts` (schema modules shared with `content.config.ts`, alias/shim, or container API) and add `resolve.alias` if aliased imports are needed.
   24	- Plan's root font-size clamp never reached 18/19px; corrected to `clamp(1rem, 0.835rem + 0.441vw, 1.1875rem)`. `@view-transition` moved out of `@layer` (invalid inside a layer).
   25	- Services gained a required `order` field (dropdown was alphabetical otherwise). Nav has a `forceOpenMenus` prop for the mobile dialog.
   26	- `trailingSlash: 'always'` and `build.format: 'directory'` pinned. JSON-LD escapes `<`.
   27	- Bluesky handle is `https://bsky.app/profile/sigreer.bsky.social` (plan had a placeholder).
   28	- Local port 8787 is occupied by an unrelated `tasktool-timeline` process; run Playwright and `bun run preview` locally with `E2E_PORT=8798`. CI uses 8787.
   29	- Lighthouse `settings.preset: "mobile"` is invalid; removed (mobile is the default). SEO assertion always fails on version previews because Cloudflare sends `x-robots-tag: noindex`; Phase 6 must scope SEO assertions to production before making Lighthouse blocking.
   30	
   31	Carry-forwards for later phases:
   32	
   33	- Phase 2: legacy MDX still imports deleted `@components/...`, `@icons/...`, `@images/...` and carries legacy frontmatter (spec §4.5). Add a `noindex` prop to Seo/Base for the 404 page. Regenerate visual baselines when `/` gains content; consider a tighter `maxDiffPixelRatio`. Drop the `@astrojs/rss` Knip ignore once `rss.xml.ts` exists. Manifest has no rows for index routes.
   34	- Phase 4: export the services schema to a plain module so the unit test can parse `services.json` against it; add an "All services" link inside the dropdown (nothing reaches `/hire-me/` from the nav today).
   35	- Phase 6: Astro CSP does not hash raw `is:inline` scripts, so the pre-paint theme script's hash must be added manually. `_headers` only applies to static-asset responses; Worker-generated responses (Actions, `/_image`) need headers set in code. HSTS `includeSubDomains` (spec §9) affects every `simongreer.co.uk` subdomain at cutover.
   36	- Cosmetic gaps vs live site, accepted for now: live "Powered by" shows six logos in a centred grid (rebuild shows four); outline vs filled moon icon; Hire Me icon glyph; wordmark slightly larger; mobile copyright wraps.
   37	- Outstanding manual steps for Simon: connect Workers Builds in the dashboard (runbook steps 1–6) and `gh secret set PAGESPEED_WEBHOOK_URL` at repo level.
### docs/runbooks/workers-builds-setup.md

    1	# Workers Builds setup for simongreer-site
    2	
    3	Manual steps done once in the Cloudflare dashboard (Workers & Pages → simongreer-site → Settings → Builds). Record the date and who did it at the bottom.
    4	
    5	1. Connect repository `sigreer/simongreer.co.uk`.
    6	2. Production branch: `rebuild/astro7` (switched to `main` at cutover step 7 in the spec).
    7	3. Build command: `bun install --frozen-lockfile && bun run build`
    8	4. Deploy command: `bunx wrangler deploy`
    9	5. Non-production branch builds: **disabled** (CI produces per-commit version previews instead).
   10	6. Build variables: none required (all vars live in wrangler.jsonc).
   11	7. Secrets on the Worker (Settings → Variables and Secrets): `TURNSTILE_SECRET_KEY` (set in Phase 5).
   12	8. Email Service: verify destination address `simon@simongreer.co.uk` under Email → Email Service before Phase 5, then add the `send_email` binding to `wrangler.jsonc` in Phase 5.
   13	9. Turnstile widget: create in Phase 5 with hostnames `simongreer.co.uk`, `sideways-systems.workers.dev`, `localhost`.
   14	
   15	Verification after the first Workers Build: `bunx wrangler deployments list` shows a deployment whose source is the connected repo and whose message contains the commit SHA on `rebuild/astro7`.
   16	
   17	## First deploy and CI preview record
   18	
   19	First manual deploy (Task 12 prerequisite, 2026-09-29, `wrangler deploy` from `222bbf88`): version `b1db463c-3660-4002-a033-a2b1595b5d84`, live at https://simongreer-site.sideways-systems.workers.dev
   20	
   21	| SHA | CI run id | Worker version id | Preview URL |
   22	|---|---|---|---|
   23	| `4fa161ed8cfa` | 36500332435 | `8c855cc1-5b14-4a81-a66d-fd01ed743739` | https://8c855cc1-simongreer-site.sideways-systems.workers.dev |
   24	| `475a0b00043b` | 36500528012 | `9631cac8-ebb6-4c01-856c-3907f311ad3a` | https://9631cac8-simongreer-site.sideways-systems.workers.dev |
   25	| `a2d347c44a12` | 36501029169 | `991bcc16-9685-4dce-800e-0b03a212ec76` | https://991bcc16-simongreer-site.sideways-systems.workers.dev |
   26	
   27	Both runs succeeded. In the first run Lighthouse did not run because of an invalid `preset: mobile` setting, fixed in `475a0b00`. From the second run, Lighthouse (non-blocking) fails only the SEO assertion with a score of 0.66. Cloudflare sends `x-robots-tag: noindex` on version preview URLs, which explains it.
   28	
   29	## Dashboard setup record
   30	
   31	| Date | Done by | Notes |
   32	|---|---|---|
   33	| | | |

<!-- superstar-prompt:end -->