unset CLOUDFLARE_API_TOKEN
unset CF_API_TOKEN
npx wrangler logout || true
npx wrangler login
npx wrangler pages deployment tail
