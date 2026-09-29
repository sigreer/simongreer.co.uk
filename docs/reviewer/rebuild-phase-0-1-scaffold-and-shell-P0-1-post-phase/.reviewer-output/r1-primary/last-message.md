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