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
| `4fa161ed8cfa` | 36500332435 | `8c855cc1-5b14-4a81-a66d-fd01ed743739` | https://8c855cc1-simongreer-site.sideways-systems.workers.dev |
| `475a0b00043b` | 36500528012 | `9631cac8-ebb6-4c01-856c-3907f311ad3a` | https://9631cac8-simongreer-site.sideways-systems.workers.dev |
| `a2d347c44a12` | 36501029169 | `991bcc16-9685-4dce-800e-0b03a212ec76` | https://991bcc16-simongreer-site.sideways-systems.workers.dev |

Both runs succeeded. In the first run Lighthouse did not run because of an invalid `preset: mobile` setting, fixed in `475a0b00`. From the second run, Lighthouse (non-blocking) fails only the SEO assertion with a score of 0.66. Cloudflare sends `x-robots-tag: noindex` on version preview URLs, which explains it.

## Dashboard setup record

| Date | Done by | Notes |
|---|---|---|
| | | |
