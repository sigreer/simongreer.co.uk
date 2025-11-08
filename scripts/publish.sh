#!/usr/bin/env bash

# Script to merge main into production and push to remote for production deployment
# Usage: bun run publish

set -e

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if we're on main branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Not currently on main branch (current: $CURRENT_BRANCH)${NC}"
    echo "Switch to main branch first with: git checkout main"
    exit 1
fi

# Fetch latest from remote
echo "Fetching latest from remote..."
git fetch origin

# Check if main is behind production
MAIN_COMMITS=$(git rev-list --count origin/main..origin/production 2>/dev/null || echo "0")
if [ "$MAIN_COMMITS" -gt 0 ]; then
    echo -e "${RED}Error: Main branch is behind production by $MAIN_COMMITS commit(s)${NC}"
    echo "This would cause conflicts. Review with: git log origin/main..origin/production"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes in main${NC}"
    git status --short
    echo ""
    echo -e "Press ${GREEN}Enter${NC} to continue anyway, or ${RED}Ctrl+C${NC} to cancel and commit changes first"
    read -r
fi

# Check if local main is behind remote main
LOCAL_BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [ "$LOCAL_BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}Warning: Your local main is behind origin/main by $LOCAL_BEHIND commit(s)${NC}"
    echo -e "Press ${GREEN}Enter${NC} to pull and continue, or ${RED}Ctrl+C${NC} to cancel"
    read -r
    git pull origin main
fi

# Show what will be merged
COMMITS_AHEAD=$(git rev-list --count origin/production..origin/main 2>/dev/null || echo "0")
echo -e "${BLUE}Commits to be merged into production: $COMMITS_AHEAD${NC}"
if [ "$COMMITS_AHEAD" -gt 0 ]; then
    echo ""
    git log --oneline origin/production..origin/main
    echo ""
fi

echo -e "${YELLOW}This will:${NC}"
echo "  1. Switch to production branch"
echo "  2. Merge main into production"
echo "  3. Push production to remote (triggering production deployment)"
echo "  4. Switch back to main branch"
echo ""
echo -e "Press ${GREEN}Enter${NC} to continue, or ${RED}Ctrl+C${NC} to cancel"
read -r

# Switch to production
echo -e "${GREEN}Switching to production branch...${NC}"
git checkout production

# Pull latest production
echo "Pulling latest production..."
git pull origin production

# Merge main into production
echo -e "${GREEN}Merging main into production...${NC}"
git merge main -m "Merge main into production for deployment"

# Push to remote
echo -e "${GREEN}Pushing production to remote...${NC}"
git push origin production

# Switch back to main
echo -e "${GREEN}Switching back to main branch...${NC}"
git checkout main

echo ""
echo -e "${GREEN}✓ Successfully published to production${NC}"
echo "Production deployment will be triggered via GitHub Actions"
