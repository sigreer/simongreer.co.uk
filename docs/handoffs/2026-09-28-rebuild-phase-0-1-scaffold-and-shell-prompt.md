# Coordinator handoff — Rebuild Phase 0–1: Scaffold, Tooling, CI Preview Pipeline and Site Shell

You are the coordinator for implementing **Rebuild Phase 0–1** of simongreer.co.uk at `/home/simon/Dev/sigreer/simongreer.co.uk/simongreer.co.uk`.

Your role is **strictly orchestration**. Use the `superstar:subagent-driven-development` skill with parallel agents where possible.

## Inputs

- Tracker: this project has no `docs/tasklist.json`. The plan's task list is the tracker; use TodoWrite per task.
- Spec: [`docs/specs/2026-09-28-site-rebuild-design.md`](docs/specs/2026-09-28-site-rebuild-design.md) (approved; external spec review chain `docs/reviewer/site-rebuild-design-spec/`, verdict `ready` at r3)
- Plan: [`docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md`](docs/plans/2026-09-28-rebuild-phase-0-1-scaffold-and-shell.md) (external plan review chain `docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-plan/`, verdict `ready` at r4)
- Audit and visual reference: [`docs/audit/2026-09-28-audit-and-stack-proposal.md`](docs/audit/2026-09-28-audit-and-stack-proposal.md) §1.6
- Route-manifest generator, already validated in both enumeration orders: embedded in plan Task 1
- Reviewer chain folder for post-phase review (created on first review): `docs/reviewer/rebuild-phase-0-1-scaffold-and-shell-post-phase/`

## Environment facts the plan relies on

- Cloudflare account subdomain: `sideways-systems.workers.dev`; API token at `~/.cloudflare/token` (must include Workers Scripts:Edit for `wrangler deploy` / `versions upload`).
- GitHub repo `sigreer/simongreer.co.uk` is **public**; repo-level secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist; `PAGESPEED_WEBHOOK_URL` exists only on the `simongreercouk` environment and must be copied to repo level (plan Task 12 prerequisite).
- Old Pages project `simongreer` keeps serving production throughout this phase. Nothing in Phase 0–1 touches DNS or custom domains.
- Work happens in the git worktree `../rebuild-astro7` on branch `rebuild/astro7` (plan Task 0). The `main` checkout stays read-only except for Task 0 step 1 (committing these docs).

## Coordinator discipline (non-negotiable)

- **Do not perform any fixes yourself** unless the fix is genuinely cheaper to implement than the process of delegating to a subagent. Tiebreak: delegate.
- **Do not pollute your context.** Delegate investigations, file reads, and edits to subagents. Your context is for orchestration, not implementation detail.
- Tasks 0–2 are sequential. Tasks 5, 7 and 8 can run in parallel once Task 4 is done. Tasks 9 and 10 depend on 5–8. Task 11 depends on 9–10. Task 12 depends on 11.
- Task 11 step 6 and the phase exit criteria include a **human gate**: Simon must look at the four shell snapshots against the live site before Task 11 is committed. Stop and ask at that point.
- Task 12 includes **manual Cloudflare dashboard steps** (Workers Builds connection). Present the runbook to Simon and wait rather than guessing.
- **At the end of the phase**, invoke `superstar:external-review` with `--kind post-phase` against the plan, with the spec as `--context`. Pass each reviewer response to a fix subagent. Iterate until the verdict is `ready` or `ready with small edits`.
- **Do not start the Phase 2 plan** until the post-phase review passes; then invoke `superstar:writing-plans` for spec §14 phase 2 against the real scaffold.

## First action

Read this file (the handoff prompt), then read the spec and the plan. Invoke `superstar:using-git-worktrees` (the plan's Task 0 creates the worktree; confirm it matches the skill's expectations), then invoke `superstar:subagent-driven-development` and begin with Task 0.
