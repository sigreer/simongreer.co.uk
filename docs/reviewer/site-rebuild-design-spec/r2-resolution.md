# Resolution for r2

## F9
Status: fixed
Evidence:
- Files: `docs/specs/2026-09-28-site-rebuild-design.md` §7 step 1
- Verification: wildcard removed; hostnames are `simongreer.co.uk`, `<account-subdomain>.workers.dev` (covers version-preview subdomains), `localhost`.

## F10
Status: fixed
Evidence:
- Files: spec §11.4 steps 2, 3 (sub-steps 1–5), 5, 6
- Verification: DNS records recorded, CNAMEs deleted explicitly and absence verified before Worker Custom Domains are added; activation + HTTPS polling with 10-minute timeout is the gate and triggers rollback; rollback restores DNS and Pages associations and verifies; rehearsal on a throwaway hostname records both directions; `/www` corrected; separate version ids acknowledged.

## F11
Status: fixed
Evidence:
- Files: spec §10 scripts and Vitest paragraph, §11.1 CI order
- Verification: `test:unit` (source-only) runs before build; `test:routes` runs after `bun run build` in the same job and asserts `dist/` is fresher than the checkout.
