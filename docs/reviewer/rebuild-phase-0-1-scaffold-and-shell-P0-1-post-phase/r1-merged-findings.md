# Merged findings for r1

## Primary

# Review — 2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md (post-phase, round 1)

- Target: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`
- Request: `docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-P0-1-post-phase/r1-2026-09-29T0104-primary-request.md`
- Reviewer command: `reviewer-agent`
- Reviewer provider: `codex`
- Sandbox: repo read-only; scratch/output writable
- Status: `ok`

---

## 1. Findings

**F1 — Severity: blocking — Explicit deployment exit gates remain unmet.**  
The [plan’s exit criteria](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md:2063) require green CI for the branch head and a Workers Builds deployment of that same commit. However:

- The [closeout](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/handoffs/rebuild-phase-0-1-closeout.md:37) explicitly leaves Workers Builds connection outstanding.
- The [dashboard setup record](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/runbooks/workers-builds-setup.md:29) is empty.
- The recorded preview is for `a2d347c4`; the reviewed checkout is `1e778a97`. The manual deployment from `222bbf88` does not establish the required Workers Builds result.

Complete and record these gates before closing, or explicitly amend the phase scope with an approved deferral, rationale, destination phase and acceptance criteria. Listing the work as “outstanding” does not reconcile the existing exit requirements.

**F2 — Severity: important — PR preview labels identify a different commit from the checkout being built.**  
[ci.yml:26–28](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/.github/workflows/ci.yml:26) selects the PR head SHA for `HEAD_SHA`, but leaves checkout’s `ref` unset. PR checkout defaults to the merge commit; explicitly selecting the head requires a `ref` override. See the [checkout documentation](https://github.com/actions/checkout#checkout-pull-request-head-commit-instead-of-merge-commit).

The [upload and summary](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/.github/workflows/ci.yml:67) therefore advertise the head SHA for an artifact built from the merge tree. This breaks the exact-commit preview contract when the base contributes changes.

Either check out the advertised head explicitly, or derive the artifact SHA from `git rev-parse HEAD` and record the PR head separately. Verify this on a PR whose merge tree differs from its head.

**F3 — Severity: minor — The authoritative tracker and closeout summary are inconsistent.**  
The [coordinator handoff](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/handoffs/2026-09-28-rebuild-phase-0-1-scaffold-and-shell-prompt.md:9) designates the plan as the tracker, but all task and exit checkboxes remain unchecked. The closeout also says “18 e2e tests” at line 16 and “17 passed, 7 skipped” at line 17; the current suite defines 24 project-expanded cases. Its stated branch head is already superseded.

Mark completed work and distinguish pending gates, accepted deviations and later-phase work. Label historical verification SHAs explicitly and correct the test count.

## 2. Open questions / assumptions

- Simon’s snapshot approval is accepted as recorded in the closeout.
- Content routes, CSP, contact functionality and blocking Lighthouse thresholds are expressly deferred; their absence is not a finding here.
- There is no separate tasklist/archive system in this checkout. The plan and closeout serve those roles.

## 3. Suggested document edits

Add a compact exit-gate table containing each requirement, status, verification SHA and evidence reference. Preserve historical deployment records, and distinguish the accepted implementation revision from subsequent documentation commits.

Retain the useful carry-forwards concerning `dist/client`, Vitest integration and CSP.

## 4. Verification gaps / commands

Independently verified: six unit tests pass in scratch; manifest generation matches committed rows in both enumeration orders; all five manifest redirects appear in `_redirects`.

The full build, browser suite and remote deployment evidence were not independently rerun. After corrections, run:

```sh
E2E_PORT=8798 bun run check &&
E2E_PORT=8798 bun run test &&
E2E_PORT=8798 bunx playwright test
```

Record the accepted revision’s CI preview and Workers Builds deployment identity, plus the planned header, redirect, 404 and immutable-asset-cache checks.

Overall verdict: revise


## Sweep 1

# Review — 2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md (post-phase, round 1)

- Target: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`
- Request: `docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-P0-1-post-phase/r1-2026-09-29T0104-sweep1-request.md`
- Reviewer command: `reviewer-agent`
- Reviewer provider: `codex`
- Sandbox: repo read-only; scratch/output writable
- Status: `ok`

---

1. Findings

- **S1.F1 — Severity: blocking — Workers Builds exit gate remains unmet.** The [plan:2038](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md:2038) requires dashboard setup and a deployment of the accepted commit; its exit checklist repeats this requirement. The [closeout:37](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/handoffs/rebuild-phase-0-1-closeout.md:37) explicitly leaves setup outstanding, and the runbook’s setup record is blank. A manual deployment and CI version uploads do not satisfy this gate. Complete and record it, or obtain an explicit scope amendment identifying the replacement milestone and acceptance evidence. The outstanding Mattermost secret also needs a recorded disposition.

- **S1.F2 — Severity: important — PR previews are labelled with a different SHA from the revision built.** In [ci.yml:26](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/.github/workflows/ci.yml:26), `HEAD_SHA` selects the PR head, while checkout has no `ref` override. For pull requests, checkout builds the merge revision by default; the upload at line 67 nevertheless tags it with the head SHA. This breaks the promised commit-to-preview identity when the base branch contributes changes. Either explicitly check out `HEAD_SHA`, or label the artifact with the actual checked-out SHA and record the PR head separately. [Checkout documentation](https://github.com/actions/checkout/tree/v4#checkout-pull-request-head-commit-instead-of-merge-commit).

- **S1.F3 — Severity: minor — Closeout evidence needs reconciliation.** The [closeout:16–17](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/handoffs/rebuild-phase-0-1-closeout.md:16) says “18 e2e tests” but reports 17 passed plus 7 skipped, and identifies an older closeout head. The [runbook:27](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/runbooks/workers-builds-setup.md:27) says “Both runs” beneath three records. Current HEAD is `1e778a97`; changes since the recorded CI revision `a2d347c4` are documentation only. State that equivalence explicitly and distinguish the tested implementation revision from the documentation revision.

2. Open questions / assumptions

- Was deferring Workers Builds explicitly approved? No such amendment appears in the supplied documents.
- No tasklist or archive tracker exists in this checkout; the plan and closeout currently carry lifecycle status.
- Content routes, CSP, contact functionality and blocking Lighthouse thresholds are explicitly deferred and are not phase-closeout defects.

3. Suggested document edits

- Add an exit-gate table with status, evidence revision, evidence location and owner for outstanding work.
- Mark the plan as historical implementation instructions and link its recorded deviations.
- Correct the test/run counts and revision descriptions; record Workers Builds evidence separately from CI preview uploads.

4. Verification gaps / commands

- Independently verified: **6 unit tests passed** in an isolated temporary copy; manifest generation matches both enumeration orders and the committed manifest; all five manifest redirects are present.
- Chromium launch failed under the reviewer sandbox (`Operation not permitted`); browser checks could not be independently repeated.
- Before closure, run:
  ```sh
  bun run check && bun run test &&
  E2E_PORT=8798 bunx playwright test
  bunx wrangler deploy --dry-run
  ```
- Verify a PR run’s checkout SHA against its preview tag, then record the accepted commit’s CI result and Workers Builds deployment identity.

Overall verdict: revise

