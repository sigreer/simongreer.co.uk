# Deployment Setup

This document explains the branch-based deployment workflow for this project.

## Branch Structure

- **`main`** - Development branch, deploys to preview/dev domain
- **`production`** - Production branch, deploys to live site (simongreer.co.uk)

## Deployment Workflows

### Dev/Preview Deployment (main branch)
**Workflow file:** `.github/workflows/cfpages.yml`

**Triggers:**
- Push to `main` branch
- Pull request to `main` branch

**Deployment:**
- Builds the site with Astro
- Deploys to Cloudflare Pages preview URL: `https://main.simongreer.pages.dev`
- Runs PageSpeed analysis on the dev domain

**Environment variables:**
- `DEV_SITE_URL` - The preview URL (e.g., `https://main.simongreer.pages.dev`)

### Production Deployment (production branch)
**Workflow file:** `.github/workflows/deploy-production.yml`

**Triggers:**
- Push to `production` branch

**Deployment:**
- Builds the site with Astro
- Deploys to Cloudflare Pages production: `https://simongreer.co.uk`
- Runs PageSpeed analysis on the production domain

**Environment variables:**
- `SITE_URL` - The production URL (defined in wrangler.toml and GitHub secrets)

## Workflow Process

### Development Workflow
1. Make changes on a feature branch
2. Create PR to `main` branch
3. Review preview deployment
4. Merge to `main` when ready
5. Changes deploy automatically to dev domain (`https://main.simongreer.pages.dev`)
6. Test changes on dev domain

### Production Deployment Workflow
1. When ready to deploy to production, create PR from `main` to `production`
2. Review changes
3. Merge to `production` branch
4. Changes deploy automatically to production domain (`https://simongreer.co.uk`)

## Initial Setup Steps

### 1. Create Production Branch
```bash
git checkout -b production
git push -u origin production
```

### 2. Configure Cloudflare Pages
In Cloudflare Dashboard:
1. Go to **Pages** → **simongreer** → **Settings** → **Builds & deployments**
2. Set **Production branch** to `production`
3. All other branches (including `main`) will automatically become preview deployments

### 3. Set GitHub Environment Variables
Add the following variable to your GitHub repository:

**Repository Variables** (Settings → Secrets and variables → Actions → Variables):
- `DEV_SITE_URL` = `https://main.simongreer.pages.dev` (or your preview URL)

**Existing variables** (no changes needed):
- `SITE_URL` = `https://simongreer.co.uk` (production)
- `MAILTRAP_HOST` = `live.smtp.mailtrap.io`
- `MAILTRAP_PORT` = `587`
- `MAILTRAP_API_USER` = `api`

**Secrets** (no changes needed):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `MAILTRAP_API_KEY`
- `MAILTRAP_FROM_EMAIL`
- `MAILTRAP_TO_EMAIL`
- `PAGESPEED_API_KEY`
- `PAGESPEED_WEBHOOK_URL`

### 4. Protect Production Branch (Recommended)
In GitHub repository settings:
1. Go to **Settings** → **Branches** → **Branch protection rules**
2. Add rule for `production` branch
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging

## Finding Your Preview URLs

### Via Cloudflare Dashboard
1. Go to **Pages** → **simongreer**
2. Click on **View build** for any deployment
3. The preview URL will be shown at the top

### Via GitHub Actions
1. Go to **Actions** tab in your repository
2. Click on a workflow run for the `main` branch
3. Look for the deployment URL in the logs

### URL Format
Preview URLs follow this pattern:
- Branch-based: `https://<branch-name>.<project-name>.pages.dev`
- Commit-based: `https://<commit-hash>.<project-name>.pages.dev`

For this project:
- Main branch: `https://main.simongreer.pages.dev`
- Production: `https://simongreer.co.uk`

## PageSpeed Analysis

Both workflows include PageSpeed analysis:
- **Dev workflow** tests `https://main.simongreer.pages.dev`
- **Production workflow** tests `https://simongreer.co.uk`

Results are sent to the configured webhook URL after each deployment.

## Troubleshooting

### Preview URL Not Working
- Wait 60 seconds after deployment completes (Cloudflare propagation)
- Check the GitHub Actions logs for the exact URL
- Verify the deployment succeeded in Cloudflare Dashboard

### PageSpeed Analysis Failing
- Ensure the site is accessible at the specified URL
- Check that `PAGESPEED_API_KEY` secret is set correctly
- Verify `DEV_SITE_URL` variable is set for the dev workflow

### Production Not Deploying
- Verify you're pushing to the `production` branch, not `main`
- Check Cloudflare Pages settings to ensure `production` is set as the production branch
- Review GitHub Actions logs for errors

## Rollback Procedure

### Rolling Back Production
1. In Cloudflare Dashboard, go to **Pages** → **simongreer**
2. Find the previous successful deployment
3. Click **...** → **Rollback to this deployment**

### Alternative: Revert via Git
```bash
# On production branch
git revert <commit-hash>
git push origin production
```

## Local Development

Local development is unaffected by this workflow:
```bash
bun dev          # Development server
bun run preview  # Local preview with Wrangler
bun run build    # Build for production
```
