# Rebuild Phase 0–1 closeout: Scaffold, Tooling, CI Preview Pipeline and Site Shell

Branch `rebuild/astro7` (worktree `../rebuild-astro7`), based on `main` at `0905f0e8`.
Plan: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`. Spec: `docs/specs/2026-09-28-site-rebuild-design.md`.

## 2026-09-29 — Phase 0–1 slice summary (coordinator)

Delivered:

- Fresh Astro 7.3.5 project on Cloudflare Workers Static Assets (`@astrojs/cloudflare` 14.3.3, Wrangler 4.143, Bun 1.4.2), replacing the Astro 5 / React / Tailwind tree. Legacy content and images are retained under `src/content` and `src/images` for Phase 2.
- Route manifest `docs/specs/route-manifest.json` generated from the legacy content (80 keep, 5 redirect, 7 drop; langchain owns `/tech/langchain/`, flowise moves to `/tech/flowise/`).
- Working Astro Action under the real Worker runtime (`ping` spike reading `env.SITE_URL` from `cloudflare:workers`), proven by Playwright against `wrangler dev`.
- Tooling: Biome 2.5 (lint + format, honours `.gitignore`), Knip 6, Vitest 5 (plain `vitest/config`), Playwright 1.63 (desktop + mobile projects, `E2E_PORT` override), `bun run check` green.
- Design system: five vanilla CSS files in cascade layers with OKLCH tokens and `light-dark()`; brand colours matched to the live site's hex values during the visual pass.
- Shell: `Base.astro` (fonts API, SEO head, pre-paint theme script, `@layer` order), `Seo.astro`, `Header.astro` (pre-header with socials + theme toggle, brand, `Nav.astro` with services dropdown fed by the new `services` collection, native `<dialog>` mobile menu), `ThemeToggle.astro`, `Footer.astro`, `404.astro`, `_headers`, `_redirects`.
- Tests: 6 unit tests, 18 e2e tests (spike, shell, visual baselines at 390 and 1360 in light and dark). Simon approved the four shell snapshots against the live site on 2026-09-29 and chose to keep the inset container width.
- CI (`.github/workflows/ci.yml`): check → unit → build → route tests → Playwright → `wrangler versions upload --tag <sha>` → wait → header check → Lighthouse (non-blocking) → PR comment → Mattermost (conditional). Worker `simongreer-site` created by a first manual deploy; `https://simongreer-site.sideways-systems.workers.dev` serves the shell; per-commit preview URLs recorded in `docs/runbooks/workers-builds-setup.md`. Head of branch at closeout: `3a52cf04`; last CI run on `a2d347c4` (run 36501029169) succeeded with preview `https://991bcc16-simongreer-site.sideways-systems.workers.dev`. Exit criteria (`bun run check`, `bun run test`, full Playwright suite: 17 passed, 7 skipped) verified on `c826e2fe`; `test:routes` runs zero tests by design until Phase 2.

Decisions and plan deviations worth knowing:

- Pagefind indexes `dist/client` (the adapter's deployable output), not `dist`. Phase 2's `routes.test.ts` must look in `dist/client`.
- `image.formats` is not an Astro 7 config key; formats go on `<Picture>`.
- Plan's `getViteConfig` for Vitest crashes under the Cloudflare adapter; plain `vitest/config` is used. Consequence: unit tests cannot import `astro:content` or resolve tsconfig path aliases. Phase 2 must choose an approach for `content.test.ts` (schema modules shared with `content.config.ts`, alias/shim, or container API) and add `resolve.alias` if aliased imports are needed.
- Plan's root font-size clamp never reached 18/19px; corrected to `clamp(1rem, 0.835rem + 0.441vw, 1.1875rem)`. `@view-transition` moved out of `@layer` (invalid inside a layer).
- Services gained a required `order` field (dropdown was alphabetical otherwise). Nav has a `forceOpenMenus` prop for the mobile dialog.
- `trailingSlash: 'always'` and `build.format: 'directory'` pinned. JSON-LD escapes `<`.
- Bluesky handle is `https://bsky.app/profile/sigreer.bsky.social` (plan had a placeholder).
- Local port 8787 is occupied by an unrelated `tasktool-timeline` process; run Playwright and `bun run preview` locally with `E2E_PORT=8798`. CI uses 8787.
- Lighthouse `settings.preset: "mobile"` is invalid; removed (mobile is the default). SEO assertion always fails on version previews because Cloudflare sends `x-robots-tag: noindex`; Phase 6 must scope SEO assertions to production before making Lighthouse blocking.

Carry-forwards for later phases:

- Phase 2: legacy MDX still imports deleted `@components/...`, `@icons/...`, `@images/...` and carries legacy frontmatter (spec §4.5). Add a `noindex` prop to Seo/Base for the 404 page. Regenerate visual baselines when `/` gains content; consider a tighter `maxDiffPixelRatio`. Drop the `@astrojs/rss` Knip ignore once `rss.xml.ts` exists. Manifest has no rows for index routes.
- Phase 4: export the services schema to a plain module so the unit test can parse `services.json` against it; add an "All services" link inside the dropdown (nothing reaches `/hire-me/` from the nav today).
- Phase 6: Astro CSP does not hash raw `is:inline` scripts, so the pre-paint theme script's hash must be added manually. `_headers` only applies to static-asset responses; Worker-generated responses (Actions, `/_image`) need headers set in code. HSTS `includeSubDomains` (spec §9) affects every `simongreer.co.uk` subdomain at cutover.
- Cosmetic gaps vs live site, accepted for now: live "Powered by" shows six logos in a centred grid (rebuild shows four); outline vs filled moon icon; Hire Me icon glyph; wordmark slightly larger; mobile copyright wraps.
- Outstanding manual steps for Simon: connect Workers Builds in the dashboard (runbook steps 1–6) and `gh secret set PAGESPEED_WEBHOOK_URL` at repo level.
