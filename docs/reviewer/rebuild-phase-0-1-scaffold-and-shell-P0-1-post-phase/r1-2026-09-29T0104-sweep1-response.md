# Review — 2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md (post-phase, round 1)

- Target: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`
- Request: `docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-P0-1-post-phase/r1-2026-09-29T0104-sweep1-request.md`
- Reviewer command: `reviewer-agent`
- Reviewer provider: `codex`
- Sandbox: repo read-only; scratch/output writable
- Status: `ok`

---

1. Findings

- **F1 — Severity: blocking — Workers Builds exit gate remains unmet.** The [plan:2038](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md:2038) requires dashboard setup and a deployment of the accepted commit; its exit checklist repeats this requirement. The [closeout:37](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/handoffs/rebuild-phase-0-1-closeout.md:37) explicitly leaves setup outstanding, and the runbook’s setup record is blank. A manual deployment and CI version uploads do not satisfy this gate. Complete and record it, or obtain an explicit scope amendment identifying the replacement milestone and acceptance evidence. The outstanding Mattermost secret also needs a recorded disposition.

- **F2 — Severity: important — PR previews are labelled with a different SHA from the revision built.** In [ci.yml:26](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/.github/workflows/ci.yml:26), `HEAD_SHA` selects the PR head, while checkout has no `ref` override. For pull requests, checkout builds the merge revision by default; the upload at line 67 nevertheless tags it with the head SHA. This breaks the promised commit-to-preview identity when the base branch contributes changes. Either explicitly check out `HEAD_SHA`, or label the artifact with the actual checked-out SHA and record the PR head separately. [Checkout documentation](https://github.com/actions/checkout/tree/v4#checkout-pull-request-head-commit-instead-of-merge-commit).

- **F3 — Severity: minor — Closeout evidence needs reconciliation.** The [closeout:16–17](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/handoffs/rebuild-phase-0-1-closeout.md:16) says “18 e2e tests” but reports 17 passed plus 7 skipped, and identifies an older closeout head. The [runbook:27](/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7/docs/runbooks/workers-builds-setup.md:27) says “Both runs” beneath three records. Current HEAD is `1e778a97`; changes since the recorded CI revision `a2d347c4` are documentation only. State that equivalence explicitly and distinguish the tested implementation revision from the documentation revision.

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
