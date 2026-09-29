# Coordinator handoff — Resume Rebuild Phase 0–1 closeout (post-phase review round 2)

You are the coordinator resuming **Rebuild Phase 0–1** of simongreer.co.uk. All 12 plan tasks are implemented, reviewed (spec + code quality per task) and committed on branch `rebuild/astro7` in the git worktree `/home/simon/Dev/sigreer/simongreer.co.uk/rebuild-astro7`. The `main` checkout at `/home/simon/Dev/sigreer/simongreer.co.uk/simongreer.co.uk` is read-only.

Your role is **strictly orchestration** (`superstar:subagent-driven-development` charter): delegate every investigation, edit and fix to subagents; you only sequence, gate on verdicts, and write closeout bookkeeping.

## Where things stand

Branch head at handoff: `f5920b19` (pushed). Last green CI run: 36501868189 on `f2a6eef0`, preview `https://bd3258b1-simongreer-site.sideways-systems.workers.dev`.

- Post-phase external review chain: `docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-P0-1-post-phase/` (`--work-id P0-1`). Round 1 verdict was `revise` (primary + sweep). A fix subagent addressed F2 (CI checks out the PR head so tag/comment match the built commit) and F3 (tracker/closeout consistency), wrote `r1-resolution.md`, pushed, and recorded the green CI run in the runbook. F1 (blocking: deployment exit gates unmet) is **deferred** because it depends on a manual step Simon had not yet done.
- Closeout note (slice summary, deviations, carry-forwards): `docs/handoffs/rebuild-phase-0-1-closeout.md`.
- Runbook with recorded deploy/preview ids: `docs/runbooks/workers-builds-setup.md`.
- Plan: `docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`. Spec: `docs/specs/2026-09-28-site-rebuild-design.md`. Original handoff: `docs/handoffs/2026-09-28-rebuild-phase-0-1-scaffold-and-shell-prompt.md`.
- Worker `simongreer-site` exists (created by a manual `wrangler deploy`); `https://simongreer-site.sideways-systems.workers.dev/` serves the shell. CI on `rebuild/astro7` uploads a tagged preview version per commit.

## Simon's two manual steps (do these first, in the browser/terminal)

1. **Connect Workers Builds** (Cloudflare dashboard → Workers & Pages → `simongreer-site` → Settings → Builds): repository `sigreer/simongreer.co.uk`; production branch `rebuild/astro7`; build command `bun install --frozen-lockfile && bun run build`; deploy command `bunx wrangler deploy`; non-production branch builds **disabled**; no build variables.
2. **Copy the Mattermost webhook to a repo-level secret** (value is in Mattermost's webhook settings; GitHub cannot show it):
   ```
   ! gh secret set PAGESPEED_WEBHOOK_URL -R sigreer/simongreer.co.uk
   ```

Tell the coordinator when step 1 is done.

## Coordinator's first actions

1. Read this file, then `docs/handoffs/rebuild-phase-0-1-closeout.md` and the latest `r*-resolution.md` in the review chain. Do not re-read the whole plan/spec unless a finding requires it.
2. Invoke `superstar:using-git-worktrees` (the worktree already exists: `git worktree list` shows `../rebuild-astro7` on `rebuild/astro7`; no tasktool in this project, so the plan is the tracker and TodoWrite tracks tasks) and `superstar:subagent-driven-development`.
3. Once Simon confirms the dashboard step, dispatch a **verification subagent** to: run `CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare/token) CLOUDFLARE_ACCOUNT_ID=$(cat ~/.cloudflare/account_id) bunx wrangler deployments list` and confirm a deployment sourced from Workers Builds for the branch head; `curl -sI https://simongreer-site.sideways-systems.workers.dev/` returns 200 with `x-frame-options: DENY`; fill the runbook's dashboard table row (date, done by Simon) and the deployment id; tick the matching exit-criteria checkbox in the plan; commit `docs(rebuild): record Workers Builds setup` and push. If the first Workers Build fails, the subagent reports the build log excerpt; fix via a subagent, never by hand.
4. Dispatch a **fix subagent** to update `r1-resolution.md` so F1 reads `Status: fixed` with the evidence above (commit sha, `wrangler deployments list` line), then run the phase exit criteria from the worktree with `E2E_PORT=8798` (port 8787 is squatted locally by an unrelated `tasktool-timeline` process; never kill it):
   ```
   bun run check && bun run test && E2E_PORT=8798 bunx playwright test && echo PHASE-0-1-OK
   ```
5. Run `git status --short` (must be clean), then re-submit the review in the **foreground**:
   ```
   external-reviewer review --kind post-phase --work-id P0-1 \
     --file docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md \
     --context docs/specs/2026-09-28-site-rebuild-design.md \
     --context docs/handoffs/rebuild-phase-0-1-closeout.md \
     --context docs/runbooks/workers-builds-setup.md \
     --timeout 580 --emit json
   ```
   Read `merged_verdict`. On `revise`, dispatch a fix subagent with the new response/merged-findings files as input; it must write `r{N}-resolution.md`; re-submit. Iterate until `ready` or `ready with small edits`.
6. On acceptance: commit the reviewer chain folder (`git add docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-P0-1-post-phase && git commit -m "docs(rebuild): post-phase review chain for phase 0-1"`), push, and dispatch the cheap **phase-closeout-summary** subagent (`superstar:subagent-driven-development` → `phase-closeout-summary-prompt.md`) to append the landed-features list to `docs/handoffs/rebuild-phase-0-1-closeout.md`; commit and push. Echo its digest.
7. Tell Simon the phase is closed and that the next step is `superstar:phase-planning` (Project Status Review) → `superstar:writing-plans` for spec §14 phase 2 against the real scaffold, using the closeout note's carry-forwards as input. Do **not** start the Phase 2 plan yourself unless Simon asks.

## Facts to keep in mind

- Deployable output is `dist/client` (adapter also emits `dist/server/wrangler.json`; `.wrangler/deploy/config.json` redirects wrangler to it). Pagefind indexes `dist/client`.
- Vitest uses plain `vitest/config` (Astro's `getViteConfig` crashes under the Cloudflare adapter). Unit tests cannot import `astro:content` and do not resolve tsconfig aliases. This is the main Phase 2 planning constraint.
- Lighthouse SEO always fails on version previews (`x-robots-tag: noindex`); the step is non-blocking. Phase 6 must scope SEO to production.
- Biome honours `.gitignore`; `bun run check` currently prints one info about `recommended` → `preset` (harmless, fix at next Biome bump).
- Snapshots are `-linux` baselines and passed on Ubuntu CI; regenerate when `/` gains content.
- Cloudflare token at `~/.cloudflare/token` has proven Workers Scripts write scope (deploy succeeded). Repo secrets `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` work in CI.
