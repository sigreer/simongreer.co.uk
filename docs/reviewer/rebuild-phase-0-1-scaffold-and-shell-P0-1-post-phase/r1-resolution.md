# Resolution for r1

## F1
Status: deferred
Evidence:
- Commit: FIX_SHA (fix(rebuild): address post-phase review r1 (F1-F3)); CI record added in DOCS_SHA
- Files: `docs/handoffs/rebuild-phase-0-1-closeout.md:39`, `docs/handoffs/rebuild-phase-0-1-closeout.md:47`, `docs/runbooks/workers-builds-setup.md:31`, `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md:2068`
- Verification: `gh run watch CI_RUN --exit-status` succeeded for FIX_SHA; preview recorded as the last row of the runbook record table.

Notes:
The Workers Builds gate is deferred: manual dashboard step assigned to Simon; coordinator has raised it. The closeout now carries an exit-gate table with status, evidence revision, evidence location and owner per gate, plus explicit acceptance criteria for the deferred gate (a Workers Builds deployment of a pushed `rebuild/astro7` SHA, before Phase 7 cutover at the latest) and states that the manual `222bbf88` deploy and CI version uploads do not substitute for it. The runbook's dashboard record section states it is not done and who owns it. The `PAGESPEED_WEBHOOK_URL` secret has a recorded disposition (deferred, Simon; CI skips the Mattermost step while unset). The automatable part is fixed: the CI run for the new accepted revision is recorded in the runbook table, and the plan's exit-criteria list is ticked except the Workers Builds item, which is annotated as deferred.

## F2
Status: fixed
Evidence:
- Commit: FIX_SHA
- Files: `.github/workflows/ci.yml:30`, `.github/workflows/ci.yml:34`
- Verification: `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/ci.yml'))"` -> yaml ok; push run CI_RUN green (assert step passed).

Notes:
Checkout now uses `ref: ${{ env.HEAD_SHA }}` (PR head on `pull_request`, `github.sha` on push), so the built tree, version tag, step summary, PR comment and Mattermost text all name the same commit. A new step fails the job if `git rev-parse HEAD` differs from `HEAD_SHA`, which enforces the contract on every run. It has not yet been exercised on a PR whose merge tree differs from its head, because no PR is open for this branch; the assertion step will catch any mismatch on the first such run.

## F3
Status: fixed
Evidence:
- Commit: FIX_SHA
- Files: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md:2054`, `docs/handoffs/rebuild-phase-0-1-closeout.md:16`, `docs/handoffs/rebuild-phase-0-1-closeout.md:17`, `docs/runbooks/workers-builds-setup.md:27`
- Verification: `grep -n '^- \[ \]' docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md` -> only lines 2038 and 2068 (Workers Builds); `E2E_PORT=8798 bunx playwright test --list` -> 24 tests in 3 files; `bun run check` exit 0.

Notes:
Plan checkboxes for all completed steps in Tasks 0–12 and the exit criteria are ticked; only Task 12 step 6 and the Workers Builds exit item stay open, each annotated as deferred with owner. The plan now points to the closeout gate table and labels its steps as historical implementation instructions. The closeout test count is corrected (12 definitions, 24 project-expanded cases, 17 passed plus 7 project-specific skips), historical verification SHAs are labelled, the docs-only equivalence of `a2d347c4..1e778a97` is stated, and the stale "head of branch" claim is replaced by a pointer to the accepted revision. The runbook's "Both runs" now reads "All recorded runs".
