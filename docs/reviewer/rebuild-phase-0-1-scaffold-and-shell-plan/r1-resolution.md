# Resolution for r1

## F1
Status: fixed
Evidence:
- Files: plan Task 0 steps 1–2
- Verification: docs are committed on `main` before the worktree is created from local `main`; step 2 lists `docs/specs docs/plans` in `$WT`.

## F2
Status: fixed
Evidence:
- Files: plan Task 2 step 1 (`rm -f src/content/config.ts`), step 6 (empty `src/content.config.ts`), inventory table
- Verification: build in Task 2 step 8 runs with the modern config location; Task 8 fills it.

## F3
Status: fixed
Evidence:
- Files: plan Task 1 generator (two-pass grouping, deterministic owner rule, self-checks, `REVERSE_ORDER` flag), step 2 expectations
- Verification: the corrected generator was executed against the current tree in both orders; identical output, counts `{"drop":7,"keep":80,"redirect":5}`, langchain.mdx → `/tech/langchain/`, flowise.mdx → `/tech/flowise/`.

## F4
Status: fixed
Evidence:
- Files: plan Task 7 step 1 (desktop-only toggle test), Task 9 step 1 (`openMobileMenu` helper; mobile tests open the menu first; mobile toggle test), updated pass counts in Tasks 7, 9, 10.

## F5
Status: fixed
Evidence:
- Files: plan Task 2 `package.json` `check` script now `wrangler types && astro check && biome check . && knip`; Task 2 step 8 runs check before build; CI order unchanged and now valid.

## F6
Status: fixed
Evidence:
- Files: plan Task 9 Header component uses `<dialog>` + `showModal()` (inert background, focus trap, Escape), `close` event restores focus and aria-expanded, `matchMedia` change closes the menu across the breakpoint, scroll lock via `body:has(.mobile-menu[open])`; tests for Tab/Shift+Tab containment, Escape + focus restoration, and viewport growth.

## F7
Status: fixed
Evidence:
- Files: plan Task 12 step 5 resolves the run id for the exact pushed SHA with a retry loop, watches and views by id, lists Worker versions; runbook records SHA, run id, version id, URL.

## Smaller edits
Status: fixed
Notes:
Inventory table corrected (`spike.astro`, `src/assets/fonts`, `src/content.config.ts`). `pipefail` convention added. `send_email` binding deferred to Phase 5 after destination verification (open question answered).
