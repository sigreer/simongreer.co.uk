# Workers Builds setup for simongreer-site

Manual steps done once in the Cloudflare dashboard (Workers & Pages → simongreer-site → Settings → Builds). Record the date and who did it at the bottom.

1. Connect repository `sigreer/simongreer.co.uk`.
2. Production branch: `rebuild/astro7` (switched to `main` at cutover step 7 in the spec).
3. Build command: `bun install --frozen-lockfile && bun run build`
4. Deploy command: `bunx wrangler deploy`
5. Non-production branch builds: **disabled** (CI produces per-commit version previews instead).
6. Build variables: none required (all vars live in wrangler.jsonc).
7. Secrets on the Worker (Settings → Variables and Secrets): `TURNSTILE_SECRET_KEY` (set in Phase 5).
8. Email Service: verify destination address `simon@simongreer.co.uk` under Email → Email Service before Phase 5, then add the `send_email` binding to `wrangler.jsonc` in Phase 5.
9. Turnstile widget: create in Phase 5 with hostnames `simongreer.co.uk`, `sideways-systems.workers.dev`, `localhost`.

Verification after the first Workers Build: `bunx wrangler deployments list` shows a deployment whose source is the connected repo and whose message contains the commit SHA on `rebuild/astro7`.

## First deploy and CI preview record

First manual deploy (Task 12 prerequisite, 2026-09-29, `wrangler deploy` from `222bbf88`): version `b1db463c-3660-4002-a033-a2b1595b5d84`, live at https://simongreer-site.sideways-systems.workers.dev

| SHA | CI run id | Worker version id | Preview URL |
|---|---|---|---|
| | | | |

## Dashboard setup record

| Date | Done by | Notes |
|---|---|---|
| | | |
