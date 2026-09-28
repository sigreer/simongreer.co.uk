# Resolution for r1

## F1
Status: fixed
Evidence:
- Files: `docs/specs/2026-09-28-site-rebuild-design.md` §2 criterion 6, §3.3, §7 step 3, §13
- Verification: spec now uses `simple: { limit: 3, period: 60 }`, states per-location approximation, and tests the 4th request within 60 s.

## F2
Status: fixed
Evidence:
- Files: spec §3.2, §6 ContactForm row, §7 preamble and step 1
- Verification: pages stay static; form submits only via JS to the Action; `<noscript>` mailto fallback; Turnstile JS requirement acknowledged.

## F3
Status: fixed
Evidence:
- Files: spec §3.2, §7 step 3, §14 phase 0
- Verification: bindings via `import { env } from 'cloudflare:workers'`; phase 0 spike executes an Action under the built Worker; criterion 6 runs against `wrangler dev`, not mocks.

## F4
Status: fixed
Evidence:
- Files: spec §4.1, §4.2 (route manifest table), criterion 2, `tests/unit/routes.test.ts`
- Verification: collection-specific prefixes incl. `/tech/projects/`; loader slug-as-id behaviour acknowledged; files renamed to slugs to keep URLs; langchain collision resolved in favour of `langchain.mdx`; `/me/get-in-touch` redirect added; manifest generated mechanically from `main`.

## F5
Status: fixed
Evidence:
- Files: spec §4.3 services table
- Verification: explicit service id → source page → `filters` mapping covering all 10 filter values in use; unmatched filters fail the build; two dead enum values removed; VPN and system-administration pages merged with 301s.

## F6
Status: fixed
Evidence:
- Files: spec §4.5 MDX migration inventory, §6 (Gallery, ExternalLink, Carousel `images` prop)
- Verification: inventory from `grep -rnE "^import " src/content --include='*.mdx'`; Dart imports inside code fences excluded; snapshots extended to the two posts using carousel/gallery/lightbox.

## F7
Status: fixed
Evidence:
- Files: spec criterion 7, §9
- Verification: CSP is a `<meta http-equiv>` policy; acceptance test injects an unhashed inline script and asserts a violation; `_headers` no longer claims to set CSP.

## F8
Status: fixed
Evidence:
- Files: spec §3.3
- Verification: `imageService: { build: 'compile', runtime: 'cloudflare-binding' }`.

## F9
Status: fixed
Evidence:
- Files: spec §11.1, §11.2
- Verification: CI creates a commit-tagged Worker version via `wrangler versions upload`, waits (bounded) for readiness, runs Lighthouse/headers against that exact version preview URL; Workers Builds non-production builds disabled; Turnstile hostnames listed.

## F10
Status: fixed
Evidence:
- Files: spec §11.4 steps 1–8, §3.1
- Verification: Workers Builds production branch starts as `rebuild/astro7`; Pages domains removed before Worker Custom Domains added (CNAME constraint cited); rollback reverses both and is rehearsed; all deletions reconciled to after one week; merge to `main` then switch production branch.

## Smaller edits
Status: fixed
Notes:
Immutable caching limited to `/_astro/*`; `/pagefind/*` gets 1 h. Pagefind generation (`postbuild`) and search acceptance test (criterion 9) added. `document.currentScript` replaced with `data-*` hooks and `data-ready` idempotency. "5.2 criteria" reference corrected. 500 message now includes the mailto fallback. Open questions answered in spec: rate limit is approximate (§7, §13); langchain owns `/tech/langchain` (§4.2); clients/testimonials migrate as `published` and published→unpublished references fail tests (§4.1); `SITE_URL` is always production and tests rewrite the host (§8); Pagefind scope defined (§8).
